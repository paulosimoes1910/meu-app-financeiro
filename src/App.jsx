import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LayoutDashboard, Plus, List, CreditCard, Repeat, Calendar, XCircle, Plane, Clock, Menu, X, ArrowUp, ArrowDown, CheckCircle, Trash2, AlertTriangle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Eye, EyeOff, Archive, FileDown, LogIn, LogOut } from 'lucide-react';

// --- Configuração do Firebase ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

const app = isFirebaseConfigValid ? initializeApp(firebaseConfig) : null;
const db = isFirebaseConfigValid ? getFirestore(app) : null;
const auth = isFirebaseConfigValid ? getAuth(app) : null;
const provider = isFirebaseConfigValid ? new GoogleAuthProvider() : null;

// --- Componente de Tela de Login ---
const LoginScreen = ({ onLogin }) => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Bem-vindo(a)!</h1>
            <p className="text-gray-400 mb-8">Faça login para gerenciar as suas finanças.</p>
            <button
                onClick={onLogin}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors text-lg"
            >
                <LogIn size={24} />
                Entrar com Google
            </button>
        </div>
    </div>
);

// --- Componentes de UI ---
const AlertModal = ({ isOpen, onClose, title, message }) => { if (!isOpen) return null; return (<div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm text-white shadow-2xl text-center" onClick={(e) => e.stopPropagation()}><div className="mx-auto bg-yellow-900/50 h-16 w-16 flex items-center justify-center rounded-full"><AlertTriangle size={40} className="text-yellow-400" /></div><h2 className="text-xl font-bold mt-6 mb-2">{title}</h2><p className="text-sm text-gray-400 mb-8">{message}</p><div className="flex justify-center"><button onClick={onClose} className="py-2 px-8 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors font-semibold">OK</button></div></div></div>); };
const ConfirmationModal = ({ isOpen, onClose, onConfirm, type = 'transacao' }) => {
    if (!isOpen) return null;
    const title = "Tem a certeza que deseja Eliminar?";
    let message;
    switch (type) {
        case 'cartao': message = "O cartão e a sua fatura serão removidos permanentemente."; break;
        case 'prestacao': message = "A prestação e todos os seus detalhes serão removidos permanentemente."; break;
        case 'gasto_fixo': message = "Este gasto fixo será removido permanentemente."; break;
        case 'falta': message = "Este registo de falta será removido permanentemente."; break;
        case 'ferias': message = "Este período de férias será removido permanentemente."; break;
        case 'hora_extra': message = "Este registo de horas extras será removido permanentemente."; break;
        default: message = "Essa ação não pode ser desfeita. A transação será removida permanentemente.";
    }
    return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm text-white shadow-2xl text-center" onClick={(e) => e.stopPropagation()}><div className="mx-auto bg-red-900/50 h-16 w-16 flex items-center justify-center rounded-full"><AlertTriangle size={40} className="text-red-400" /></div><h2 className="text-xl font-bold mt-6 mb-2">{title}</h2><p className="text-sm text-gray-400 mb-8">{message}</p><div className="flex justify-center gap-4"><button onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors font-semibold">Cancelar</button><button onClick={onConfirm} className="py-2 px-6 bg-red-600 hover:bg-red-500 rounded-lg transition-colors font-semibold">Eliminar</button></div></div></div>);
};
const ReceitaModal = ({ isOpen, onClose, userId, showSuccessMessage }) => { const [descricao, setDescricao] = useState(''); const [valor, setValor] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const handleSubmit = async (e) => { e.preventDefault(); if (!descricao.trim() || !valor || !userId || !db) return; setIsSubmitting(true); try { await addDoc(collection(db, `users/${userId}/transacoes`), { descricao, valor: parseFloat(valor), tipo: 'receita', moeda: 'GBP', data: serverTimestamp() }); setDescricao(''); setValor(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar receita: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-green-400">ADICIONAR RECEITA</h2><form onSubmit={handleSubmit} className="space-y-6"><div><label htmlFor="descricao-receita" className="block text-sm font-medium text-gray-400 mb-1">Descrição</label><input id="descricao-receita" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Salário, Venda de item" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" required /></div><div><label htmlFor="valor-receita" className="block text-sm font-medium text-gray-400 mb-1">Valor</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-400">£</span></div><input id="valor-receita" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1,500.00" className="w-full p-3 pl-8 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" required /></div></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:bg-green-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const DespesaModal = ({ isOpen, onClose, userId, showSuccessMessage }) => { const [descricao, setDescricao] = useState(''); const [valor, setValor] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const handleSubmit = async (e) => { e.preventDefault(); if (!descricao.trim() || !valor || !userId || !db) return; setIsSubmitting(true); try { await addDoc(collection(db, `users/${userId}/transacoes`), { descricao, valor: parseFloat(valor), tipo: 'despesa', moeda: 'GBP', data: serverTimestamp() }); setDescricao(''); setValor(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar despesa: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-red-400">ADICIONAR DESPESA</h2><form onSubmit={handleSubmit} className="space-y-6"><div><label htmlFor="descricao-despesa" className="block text-sm font-medium text-gray-400 mb-1">Descrição</label><input id="descricao-despesa" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Renda, Supermercado" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" required /></div><div><label htmlFor="valor-despesa" className="block text-sm font-medium text-gray-400 mb-1">Valor</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-400">£</span></div><input id="valor-despesa" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="300.00" className="w-full p-3 pl-8 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" required /></div></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:bg-red-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const CartaoModal = ({ isOpen, onClose, userId, showSuccessMessage }) => { const [nome, setNome] = useState(''); const [valor, setValor] = useState(''); const [vencimento, setVencimento] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const handleSubmit = async (e) => { e.preventDefault(); if (!nome.trim() || !valor || !vencimento || !userId || !db) return; setIsSubmitting(true); try { await addDoc(collection(db, `users/${userId}/cartoes`), { nome, valorFatura: parseFloat(valor), vencimentoFatura: vencimento, moeda: 'GBP', data: serverTimestamp() }); setNome(''); setValor(''); setVencimento(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar cartão: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-blue-400">ADICIONAR CARTÃO</h2><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="nome-cartao" className="block text-sm font-medium text-gray-400 mb-1">Nome do Cartão</label><input id="nome-cartao" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Amex, Aqua" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div><div className="flex gap-4"><div className="w-1/2"><label htmlFor="valor-fatura" className="block text-sm font-medium text-gray-400 mb-1">Valor da Fatura</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-400">£</span></div><input id="valor-fatura" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="500.00" className="w-full p-3 pl-8 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div><div className="w-1/2"><label htmlFor="vencimento-fatura" className="block text-sm font-medium text-gray-400 mb-1">Venc. Fatura</label><input id="vencimento-fatura" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const PrestacaoModal = ({ isOpen, onClose, userId, showSuccessMessage }) => { const [descricao, setDescricao] = useState(''); const [valorParcela, setValorParcela] = useState(''); const [numParcelas, setNumParcelas] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const valorTotal = (parseFloat(valorParcela) || 0) * (parseInt(numParcelas) || 0); const handleSubmit = async (e) => { e.preventDefault(); if (!descricao.trim() || !valorParcela || !numParcelas || !userId || !db) return; setIsSubmitting(true); try { await addDoc(collection(db, `users/${userId}/prestacoes`), { descricao, valorParcela: parseFloat(valorParcela), numParcelas: parseInt(numParcelas), valorTotal, moeda: 'GBP', data: serverTimestamp() }); setDescricao(''); setValorParcela(''); setNumParcelas(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar prestação: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-yellow-400">ADICIONAR PRESTAÇÃO</h2><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="descricao-prestacao" className="block text-sm font-medium text-gray-400 mb-1">Descrição</label><input id="descricao-prestacao" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Compra de Celular" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" required /></div><div className="flex gap-4"><div className="w-1/2"><label htmlFor="valor-prestacao" className="block text-sm font-medium text-gray-400 mb-1">Valor da Prestação</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-400">£</span></div><input id="valor-prestacao" type="number" step="0.01" value={valorParcela} onChange={(e) => setValorParcela(e.target.value)} placeholder="80.00" className="w-full p-3 pl-8 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" required /></div></div><div className="w-1/2"><label htmlFor="num-parcelas" className="block text-sm font-medium text-gray-400 mb-1">N° de Parcelas</label><input id="num-parcelas" type="number" value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} placeholder="12" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" required /></div></div><div className="pt-4"><div className="flex justify-end"><div className="text-right"><p className="text-sm text-gray-400">Valor Total</p><p className="text-lg font-bold text-yellow-400">£{valorTotal.toFixed(2)}</p></div></div></div><div className="flex justify-end gap-4 pt-2"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors disabled:bg-yellow-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const GastoFixoModal = ({ isOpen, onClose, userId, showSuccessMessage }) => { const [descricao, setDescricao] = useState(''); const [valorParcela, setValorParcela] = useState(''); const [numParcelas, setNumParcelas] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const valorTotal = (parseFloat(valorParcela) || 0) * (parseInt(numParcelas) || 0); const handleSubmit = async (e) => { e.preventDefault(); if (!descricao.trim() || !valorParcela || !numParcelas || !userId || !db) return; setIsSubmitting(true); try { await addDoc(collection(db, `users/${userId}/gastos_fixos`), { descricao, valorParcela: parseFloat(valorParcela), numParcelas: parseInt(numParcelas), valorTotal, moeda: 'GBP', data: serverTimestamp() }); setDescricao(''); setValorParcela(''); setNumParcelas(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar gasto fixo: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-purple-400">ADICIONAR GASTO FIXO</h2><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="descricao-gasto-fixo" className="block text-sm font-medium text-gray-400 mb-1">Descrição</label><input id="descricao-gasto-fixo" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Renda, Internet" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required /></div><div className="flex gap-4"><div className="w-1/2"><label htmlFor="valor-gasto-fixo" className="block text-sm font-medium text-gray-400 mb-1">Valor da Parcela</label><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-gray-400">£</span></div><input id="valor-gasto-fixo" type="number" step="0.01" value={valorParcela} onChange={(e) => setValorParcela(e.target.value)} placeholder="350.00" className="w-full p-3 pl-8 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required /></div></div><div className="w-1/2"><label htmlFor="num-parcelas-gasto-fixo" className="block text-sm font-medium text-gray-400 mb-1">N° de Parcelas</label><input id="num-parcelas-gasto-fixo" type="number" value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} placeholder="12" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" required /></div></div><div className="pt-4"><div className="flex justify-end"><div className="text-right"><p className="text-sm text-gray-400">Valor Total</p><p className="text-lg font-bold text-purple-400">£{valorTotal.toFixed(2)}</p></div></div></div><div className="flex justify-end gap-4 pt-2"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const FaltaModal = ({ isOpen, onClose, userId, showSuccessMessage, faltas, showCustomAlert }) => { const [dataFalta, setDataFalta] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const handleSubmit = async (e) => { e.preventDefault(); if (!dataFalta || !userId || !db) return; const isDuplicate = faltas.some(falta => falta.data === dataFalta); if (isDuplicate) { showCustomAlert("Data Duplicada", "Esta data já foi registada como falta."); return; } setIsSubmitting(true); try { await addDoc(collection(db, `users/${userId}/faltas`), { data: dataFalta }); setDataFalta(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar falta: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-orange-400">ADICIONAR FALTAS</h2><form onSubmit={handleSubmit} className="space-y-6"><div><label htmlFor="data-falta" className="block text-sm font-medium text-gray-400 mb-1">Data da Falta</label><input id="data-falta" type="date" value={dataFalta} onChange={(e) => setDataFalta(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" required /></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors disabled:bg-orange-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const FeriasModal = ({ isOpen, onClose, userId, showSuccessMessage }) => { const [tipo, setTipo] = useState('dia'); const [dataInicio, setDataInicio] = useState(''); const [dataFim, setDataFim] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const calculateBusinessDays = (start, end) => { let count = 0; const curDate = new Date(start.valueOf()); while (curDate <= end) { const dayOfWeek = curDate.getUTCDay(); if (dayOfWeek !== 0 && dayOfWeek !== 6) { count++; } curDate.setUTCDate(curDate.getUTCDate() + 1); } return count; }; const handleSubmit = async (e) => { e.preventDefault(); if (!dataInicio || (tipo === 'periodo' && !dataFim) || !db) return; setIsSubmitting(true); const startDate = new Date(Date.parse(dataInicio + 'T00:00:00Z')); const endDate = tipo === 'periodo' ? new Date(Date.parse(dataFim + 'T00:00:00Z')) : startDate; if (endDate < startDate) { alert("A data final não pode ser anterior à data inicial."); setIsSubmitting(false); return; } const diasTirados = calculateBusinessDays(startDate, endDate); try { await addDoc(collection(db, `users/${userId}/ferias`), { dataInicio: dataInicio, dataFim: tipo === 'periodo' ? dataFim : dataInicio, diasTirados, data: serverTimestamp() }); setDataInicio(''); setDataFim(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar férias: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-teal-400">ADICIONAR FÉRIAS</h2><form onSubmit={handleSubmit} className="space-y-6"><div><div className="flex bg-gray-700 rounded-lg p-1 mb-4"><button type="button" onClick={() => setTipo('dia')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${tipo === 'dia' ? 'bg-teal-500' : 'hover:bg-gray-600'}`}>Um dia</button><button type="button" onClick={() => setTipo('periodo')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${tipo === 'periodo' ? 'bg-teal-500' : 'hover:bg-gray-600'}`}>Período</button></div></div>{tipo === 'dia' ? (<div><label htmlFor="data-ferias" className="block text-sm font-medium text-gray-400 mb-1">Data</label><input id="data-ferias" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div>) : (<div className="flex gap-4"><div className="w-1/2"><label htmlFor="data-inicio" className="block text-sm font-medium text-gray-400 mb-1">Do dia</label><input id="data-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div><div className="w-1/2"><label htmlFor="data-fim" className="block text-sm font-medium text-gray-400 mb-1">Até ao dia</label><input id="data-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required /></div></div>)}<div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors disabled:bg-teal-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const HoraExtraModal = ({ isOpen, onClose, userId, showSuccessMessage }) => { const [data, setData] = useState(''); const [horas, setHoras] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); if (!isOpen) return null; const handleSubmit = async (e) => { e.preventDefault(); if (!data || !horas || !userId || !db) return; setIsSubmitting(true); try { await addDoc(collection(db, `users/${userId}/hora_extras`), { data, quantidadeHoras: parseFloat(horas), createdAt: serverTimestamp() }); setData(''); setHoras(''); showSuccessMessage(); onClose(); } catch (error) { console.error("Erro ao adicionar hora extra: ", error); } finally { setIsSubmitting(false); } }; return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl" onClick={(e) => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-center text-indigo-400">ADICIONAR HORA EXTRA</h2><form onSubmit={handleSubmit} className="space-y-6"><div><label htmlFor="data-he" className="block text-sm font-medium text-gray-400 mb-1">Data</label><input id="data-he" type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required /></div><div><label htmlFor="horas-he" className="block text-sm font-medium text-gray-400 mb-1">Quantidade de Horas</label><input id="horas-he" type="number" step="0.1" value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="8.5" className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required /></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">Cancelar</button><button type="submit" disabled={isSubmitting} className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed">{isSubmitting ? 'A Guardar...' : 'Adicionar'}</button></div></form></div></div>); };
const LaunchCenterContent = ({ onLaunchTypeSelect }) => { const launchOptions = [ { label: 'Receita', icon: <ArrowUp />, color: 'bg-green-500', shadowColor: 'border-green-700', type: 'receita' }, { label: 'Despesa', icon: <ArrowDown />, color: 'bg-red-500', shadowColor: 'border-red-700', type: 'despesa' }, { label: 'Cartão', icon: <CreditCard />, color: 'bg-blue-500', shadowColor: 'border-blue-700', type: 'cartao' }, { label: 'Prestação', icon: <Repeat />, color: 'bg-yellow-500', shadowColor: 'border-yellow-700', type: 'prestacao' }, { label: 'Gastos Fixos', icon: <Archive />, color: 'bg-purple-500', shadowColor: 'border-purple-700', type: 'gasto_fixo' }, { label: 'Falta', icon: <XCircle />, color: 'bg-orange-500', shadowColor: 'border-orange-700', type: 'falta' }, { label: 'Férias', icon: <Plane />, color: 'bg-teal-500', shadowColor: 'border-teal-700', type: 'ferias' }, { label: 'Hora Extra', icon: <Clock />, color: 'bg-indigo-500', shadowColor: 'border-indigo-700', type: 'hora_extra' }, ]; return (<div className="flex-grow flex items-start justify-center pt-10 animate-fade-in"><div className="w-96 grid grid-cols-3 gap-4">{launchOptions.map(opt => (<button key={opt.label} onClick={() => onLaunchTypeSelect(opt.type)} className={`${opt.color} ${opt.shadowColor} aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 p-4 text-white font-semibold transition-all duration-150 ease-in-out border-b-4 active:border-b-0 active:translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white`}>{React.cloneElement(opt.icon, { size: 28 })}<span className="text-sm text-center mt-1">{opt.label}</span></button>))}</div></div>); };
const VisaoGeralContent = ({ transacoes, cartoes, prestacoes, formatCurrency, isPdfLibReady }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDataVisible, setIsDataVisible] = useState(true);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthlySummary = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const filteredTransacoes = transacoes.filter(t => { const d = t.data?.toDate(); return d && d.getFullYear() === year && d.getMonth() === month; });
        const filteredCartoes = cartoes.filter(c => { const d = new Date(c.vencimentoFatura + 'T00:00:00Z'); return d && d.getUTCFullYear() === year && d.getUTCMonth() === month; });
        const filteredPrestacoes = prestacoes.filter(p => { const s = p.data?.toDate() || new Date(); const m = (year - s.getFullYear()) * 12 + (month - s.getMonth()); return m >= 0 && m < p.numParcelas; });
        const totalReceitas = filteredTransacoes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0);
        const despesasGerais = filteredTransacoes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0);
        const faturasCartao = filteredCartoes.reduce((a, c) => a + c.valorFatura, 0);
        const prestacoesMes = filteredPrestacoes.reduce((a, p) => a + p.valorParcela, 0);
        const totalDespesas = despesasGerais + faturasCartao + prestacoesMes;
        const saldoTotal = totalReceitas - totalDespesas;
        const prestacoesAtivas = prestacoes.map(p => { const s = p.data?.toDate() || new Date(); const m = (new Date().getFullYear() - s.getFullYear()) * 12 + (new Date().getMonth() - s.getMonth()); return { ...p, isAtiva: m >= 0 && m < p.numParcelas, parcelaAtual: m + 1 }; }).filter(p => p.isAtiva);
        return { saldoTotal, totalReceitas, totalDespesas, despesasGerais, faturasCartao, prestacoesMes, prestacoesAtivas, filteredTransacoes, filteredCartoes, filteredPrestacoes };
    }, [currentDate, transacoes, cartoes, prestacoes]);

    const generatePDF = () => {
        if (!isPdfLibReady || !window.jspdf) { console.error("PDF libraries not ready."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const monthYear = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        let finalY = 20;

        doc.setFontSize(18);
        doc.text(`Relatório Mensal - ${monthYear.toUpperCase()}`, 14, finalY);
        finalY += 15;
        
        const addTable = (title, head, body, totalLabel, totalValue) => {
            if (body.length > 0) {
                doc.setFontSize(12);
                doc.text(title, 14, finalY);
                finalY += 8;
                
                doc.autoTable({
                    head: [head],
                    body: body,
                    startY: finalY,
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185] },
                    didDrawPage: (data) => {
                        doc.setFontSize(10);
                        doc.setFont(undefined, 'bold');
                        const totalText = `${totalLabel}: ${formatCurrency(totalValue)}`;
                        const textWidth = doc.getTextWidth(totalText);
                        const pageWidth = doc.internal.pageSize.width;
                        const x = pageWidth - data.settings.margin.right - textWidth;
                        let y = data.cursor.y + 10;
                        if (data.pageNumber > 1) { y = doc.internal.pageSize.height - 10; }
                        doc.text(totalText, x, y);
                    }
                });
                finalY = doc.lastAutoTable.finalY + 15;
            }
        };

        const receitasDoMes = monthlySummary.filteredTransacoes.filter(t => t.tipo === 'receita');
        addTable("Receitas", ["Descrição", "Data", "Valor"], receitasDoMes.map(item => [item.descricao, item.data?.toDate().toLocaleDateString('pt-BR') || 'N/A', formatCurrency(item.valor)]), "Total Receitas", monthlySummary.totalReceitas);

        const despesasDoMes = monthlySummary.filteredTransacoes.filter(t => t.tipo === 'despesa');
        addTable("Despesas Gerais", ["Descrição", "Data", "Valor"], despesasDoMes.map(item => [item.descricao, item.data?.toDate().toLocaleDateString('pt-BR') || 'N/A', formatCurrency(item.valor)]), "Total Despesas", monthlySummary.despesasGerais);

        addTable("Faturas de Cartão", ["Nome", "Vencimento", "Valor"], monthlySummary.filteredCartoes.map(item => [item.nome, new Date(item.vencimentoFatura + 'T00:00:00Z').toLocaleDateString('pt-BR'), formatCurrency(item.valorFatura)]), "Total Faturas", monthlySummary.faturasCartao);

        addTable("Prestações do Mês", ["Descrição", "Valor da Parcela"], monthlySummary.filteredPrestacoes.map(item => [item.descricao, formatCurrency(item.valorParcela)]), "Total Prestações", monthlySummary.prestacoesMes);
        
        finalY = Math.max(finalY, 20);
        doc.setFontSize(12);
        doc.text("Resumo Financeiro do Mês", 14, finalY);
        doc.autoTable({
            body: [
                ['Total de Receitas:', { content: formatCurrency(monthlySummary.totalReceitas), styles: { halign: 'right' } }],
                ['Total de Despesas:', { content: formatCurrency(monthlySummary.totalDespesas), styles: { halign: 'right' } }],
                ['SALDO FINAL:', { content: formatCurrency(monthlySummary.saldoTotal), styles: { halign: 'right', fontStyle: 'bold' } }],
            ],
            startY: finalY + 8,
            theme: 'striped',
            styles: { fontStyle: 'bold' },
            columnStyles: { 0: { fontStyle: 'bold' } }
        });

        doc.save(`relatorio_${currentDate.getMonth()+1}_${currentDate.getFullYear()}.pdf`);
    };
    const toggleVisibility = () => setIsDataVisible(!isDataVisible);
    const hiddenValue = '£ ••••,••';

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
                 <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeft size={24} /></button>
                 <div className="text-center"><p className="text-lg font-bold text-white">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</p></div>
                 <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-700"><ChevronRight size={24} /></button>
                 <button onClick={generatePDF} disabled={!isPdfLibReady} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"><FileDown size={20} /><span className="hidden sm:inline">{isPdfLibReady ? 'Relatório' : 'A carregar...'}</span></button>
            </div>
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between min-h-[180px] relative">
                <button onClick={toggleVisibility} className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors">{isDataVisible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                <div className="text-center"><h2 className="text-sm font-semibold text-blue-200">Saldo do Mês</h2><p className={`text-4xl font-bold mt-1 ${monthlySummary.saldoTotal < 0 ? 'text-red-300' : ''}`}>{isDataVisible ? formatCurrency(monthlySummary.saldoTotal) : hiddenValue}</p></div>
                <div className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="bg-white/20 p-2 rounded-full"><TrendingUp size={16} /></div><div><p className="text-xs text-blue-200">Receitas</p><p className="font-semibold">{isDataVisible ? formatCurrency(monthlySummary.totalReceitas) : hiddenValue}</p></div></div><div className="flex items-center gap-2"><div className="bg-white/20 p-2 rounded-full"><TrendingDown size={16} /></div><div><p className="text-xs text-blue-200">Despesas</p><p className="font-semibold">{isDataVisible ? formatCurrency(monthlySummary.totalDespesas) : hiddenValue}</p></div></div></div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6"><h3 className="text-lg font-bold text-white mb-4">Divisão de Despesas do Mês</h3><div className="space-y-2"><div className="flex justify-between items-center"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-red-500"></span><p>Despesas Gerais</p></div><p className="font-semibold text-red-400">{isDataVisible ? formatCurrency(monthlySummary.despesasGerais) : hiddenValue}</p></div><div className="flex justify-between items-center"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-blue-400"></span><p>Faturas de Cartão</p></div><p className="font-semibold text-blue-400">{isDataVisible ? formatCurrency(monthlySummary.faturasCartao) : hiddenValue}</p></div><div className="flex justify-between items-center"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-yellow-400"></span><p>Prestações do Mês</p></div><p className="font-semibold text-yellow-400">{isDataVisible ? formatCurrency(monthlySummary.prestacoesMes) : hiddenValue}</p></div></div></div>
            <div className="bg-gray-800 rounded-2xl p-6"><h3 className="text-lg font-bold text-white mb-4">Acompanhamento de Prestações (Geral)</h3><div className="space-y-4">{monthlySummary.prestacoesAtivas.length > 0 ? monthlySummary.prestacoesAtivas.map(p => (<div key={p.id}><div className="flex justify-between items-center mb-1"><p className="font-semibold">{p.descricao}</p><p className="text-sm text-gray-400">Parcela {p.parcelaAtual} de {p.numParcelas}</p></div><div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${(p.parcelaAtual / p.numParcelas) * 100}%` }}></div></div></div>)) : <p className="text-sm text-gray-500">Nenhuma prestação ativa este mês.</p>}</div></div>
        </div>
    );
};
const TransacoesContent = ({ transacoes, formatCurrency, handleDeleteRequest, isPdfLibReady }) => {
    const [filter, setFilter] = useState('todos');
    const generatePDF = (items, filter) => {
        if (!isPdfLibReady || !window.jspdf) { console.error("PDF libraries not ready."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const title = `Relatório de Transações ${filter !== 'todos' ? `(${filter})` : ''}`;
        doc.text(title, 14, 20);

        const tableColumn = ["Descrição", "Data", "Tipo", "Valor"];
        const tableRows = items.map(item => [
            item.descricao,
            item.data?.toDate().toLocaleDateString('pt-BR') || 'N/A',
            item.tipo,
            formatCurrency(item.valor)
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            didDrawPage: (data) => {
                const finalY = data.cursor.y + 10;
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                
                const drawTotal = (label, value, yPos) => {
                    const text = `${label}: ${formatCurrency(value)}`;
                    const textWidth = doc.getTextWidth(text);
                    const pageWidth = doc.internal.pageSize.width;
                    const x = pageWidth - data.settings.margin.right - textWidth;
                    doc.text(text, x, yPos);
                }
                
                const totalReceitas = items.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
                const totalDespesas = items.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
                const saldo = totalReceitas - totalDespesas;
                
                let currentY = finalY;
                drawTotal('Total de Receitas', totalReceitas, currentY);
                currentY += 6;
                drawTotal('Total de Despesas', totalDespesas, currentY);
                currentY += 6;
                drawTotal('Saldo', saldo, currentY);
            }
        });

        doc.save(`relatorio_transacoes_${filter}.pdf`);
    };
    const filterOptions = useMemo(() => { const descriptions = transacoes.map(item => item.descricao); return ['todos', ...new Set(descriptions)]; }, [transacoes]);
    const filteredTransacoes = useMemo(() => { if (filter === 'todos') return transacoes; return transacoes.filter(item => item.descricao === filter); }, [filter, transacoes]);
    const totalReceitas = filteredTransacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
    const totalDespesas = filteredTransacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Contabilidade de Transações</h3>
                <div className="flex justify-center gap-12 text-center">
                    <div><p className="text-2xl font-bold text-green-400">{formatCurrency(totalReceitas)}</p><p className="text-sm text-gray-400">Total Receitas</p></div>
                    <div><p className="text-2xl font-bold text-red-400">{formatCurrency(totalDespesas)}</p><p className="text-sm text-gray-400">Total Despesas</p></div>
                </div>
            </div>
            <div className="mb-6 flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="filter-transacoes" className="block text-sm font-medium text-gray-400 mb-1">Organizar por:</label>
                    <select id="filter-transacoes" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {filterOptions.map(option => (<option key={option} value={option}>{option === 'todos' ? 'Todos os Lançamentos' : option}</option>))}
                    </select>
                </div>
                <button onClick={() => generatePDF(filteredTransacoes, filter)} disabled={!isPdfLibReady} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"><FileDown size={20} /><span>{isPdfLibReady ? 'Relatório' : 'A carregar...'}</span></button>
            </div>
            <h2 className="text-2xl font-bold mb-4">Relatório de Transações</h2>
            <div className="space-y-3">
                {filteredTransacoes.length > 0 ? filteredTransacoes.map(item => (
                    <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center">
                        <div className="flex-grow">
                            <p className="font-semibold text-white">{item.descricao}</p>
                            <p className="text-xs text-gray-400">{item.data?.toDate().toLocaleString('pt-BR') || 'Data indisponível'}</p>
                        </div>
                        <span className={`font-bold text-lg mr-6 ${item.tipo === 'receita' ? 'text-green-400' : 'text-red-400'}`}>{item.tipo === 'receita' ? '+' : ''} {formatCurrency(item.valor)}</span>
                        <button onClick={() => handleDeleteRequest(item.id, 'transacao')} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                    </div>
                )) : <p className="text-gray-500 text-center mt-8">Nenhuma transação encontrada.</p>}
            </div>
        </div>
    );
};
const CartoesContent = ({ cartoes, formatCurrency, handleDeleteRequest, isPdfLibReady }) => {
    const [filter, setFilter] = useState('todos');
    const generatePDF = (items, filter) => {
        if (!isPdfLibReady || !window.jspdf) { console.error("PDF libraries not ready."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const title = `Relatório de Cartões ${filter !== 'todos' ? `(${filter})` : ''}`;
        doc.text(title, 14, 20);

        const tableColumn = ["Nome do Cartão", "Vencimento", "Valor da Fatura"];
        const tableRows = items.map(item => [
            item.nome,
            new Date(Date.parse(item.vencimentoFatura + 'T00:00:00Z')).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            formatCurrency(item.valorFatura)
        ]);
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            didDrawPage: (data) => {
                const finalY = data.cursor.y + 10;
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                const totalFaturas = items.reduce((acc, t) => acc + t.valorFatura, 0);
                const totalText = `Total em Faturas: ${formatCurrency(totalFaturas)}`;
                const textWidth = doc.getTextWidth(totalText);
                const pageWidth = doc.internal.pageSize.width;
                const x = pageWidth - data.settings.margin.right - textWidth;
                doc.text(totalText, x, finalY);
            }
        });

        doc.save(`relatorio_cartoes_${filter}.pdf`);
    };
    const filterOptions = useMemo(() => { const descriptions = cartoes.map(item => item.nome); return ['todos', ...new Set(descriptions)]; }, [cartoes]);
    const filteredCartoes = useMemo(() => { if (filter === 'todos') return cartoes; return cartoes.filter(item => item.nome === filter); }, [filter, cartoes]);
    const totalFaturas = filteredCartoes.reduce((acc, card) => acc + card.valorFatura, 0);
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-gray-800 rounded-2xl p-6 mb-6"><h3 className="text-lg font-bold text-white mb-4 text-center">Contabilidade de Cartões</h3><div className="flex justify-center gap-12 text-center"><div><p className="text-2xl font-bold text-blue-400">{formatCurrency(totalFaturas)}</p><p className="text-sm text-gray-400">Total em Faturas</p></div></div></div>
            <div className="mb-6 flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="filter-cartoes" className="block text-sm font-medium text-gray-400 mb-1">Organizar por:</label>
                    <select id="filter-cartoes" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {filterOptions.map(option => (<option key={option} value={option}>{option === 'todos' ? 'Todos os Cartões' : option}</option>))}
                    </select>
                </div>
                <button onClick={() => generatePDF(filteredCartoes, filter)} disabled={!isPdfLibReady} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"><FileDown size={20} /><span>{isPdfLibReady ? 'Relatório' : 'A carregar...'}</span></button>
            </div>
            <h2 className="text-2xl font-bold mb-4">Meus Cartões</h2>
            <div className="space-y-3">
                {filteredCartoes.length > 0 ? filteredCartoes.map(card => (<div key={card.id} className="bg-gray-800 p-4 rounded-lg flex items-center"><div className="flex-grow"><p className="font-semibold text-white">{card.nome}</p><p className="text-xs text-gray-400">Venc.: {new Date(Date.parse(card.vencimentoFatura + 'T00:00:00Z')).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}</p></div><span className="font-bold text-lg mr-6 text-blue-400">{formatCurrency(card.valorFatura)}</span><button onClick={() => handleDeleteRequest(card.id, 'cartao')} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button></div>)) : <p className="text-gray-500 text-center mt-8">Nenhum cartão encontrado.</p>}
            </div>
        </div>
    );
};
const PrestacoesContent = ({ prestacoes, formatCurrency, handleDeleteRequest, isPdfLibReady }) => {
    const [filter, setFilter] = useState('todos');
    const generatePDF = (items, filter) => {
        if (!isPdfLibReady || !window.jspdf) { console.error("PDF libraries not ready."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const title = `Relatório de Prestações ${filter !== 'todos' ? `(${filter})` : ''}`;
        doc.text(title, 14, 20);

        const tableColumn = ["Descrição", "Nº de Parcelas", "Valor da Parcela", "Valor Total"];
        const tableRows = items.map(item => [
            item.descricao,
            item.numParcelas,
            formatCurrency(item.valorParcela),
            formatCurrency(item.valorTotal)
        ]);
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            didDrawPage: (data) => {
                let finalY = data.cursor.y + 10;
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                
                const drawTotal = (label, value, yPos) => {
                    const text = `${label}: ${formatCurrency(value)}`;
                    const textWidth = doc.getTextWidth(text);
                    const pageWidth = doc.internal.pageSize.width;
                    const x = pageWidth - data.settings.margin.right - textWidth;
                    doc.text(text, x, yPos);
                }
                
                const totalParcelasMes = items.filter(p => { const currentDate = new Date(); const currentYear = currentDate.getFullYear(); const currentMonth = currentDate.getMonth(); const startDate = p.data?.toDate() || new Date(); const monthsPassed = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth()); return monthsPassed >= 0 && monthsPassed < p.numParcelas; }).reduce((acc, p) => acc + p.valorParcela, 0);
                const dividaTotal = items.reduce((acc, item) => acc + item.valorTotal, 0);
                
                drawTotal('Total Parcelas do Mês', totalParcelasMes, finalY);
                finalY += 6;
                drawTotal('Dívida Total', dividaTotal, finalY);
            }
        });

        doc.save(`relatorio_prestacoes_${filter}.pdf`);
    };
    const filterOptions = useMemo(() => { const descriptions = prestacoes.map(item => item.descricao); return ['todos', ...new Set(descriptions)]; }, [prestacoes]);
    const filteredPrestacoes = useMemo(() => { if (filter === 'todos') return prestacoes; return prestacoes.filter(item => item.descricao === filter); }, [filter, prestacoes]);
    const totalDivida = filteredPrestacoes.reduce((acc, item) => acc + item.valorTotal, 0);
    const prestacoesMesFiltradas = filteredPrestacoes.filter(p => { const currentDate = new Date(); const currentYear = currentDate.getFullYear(); const currentMonth = currentDate.getMonth(); const startDate = p.data?.toDate() || new Date(); const monthsPassed = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth()); return monthsPassed >= 0 && monthsPassed < p.numParcelas; }).reduce((acc, p) => acc + p.valorParcela, 0);
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-gray-800 rounded-2xl p-6 mb-6"><h3 className="text-lg font-bold text-white mb-4 text-center">Contabilidade de Prestações</h3><div className="flex justify-center items-end gap-12 text-center"><div><p className="text-2xl font-bold text-yellow-400">{formatCurrency(prestacoesMesFiltradas)}</p><p className="text-sm text-gray-400">Total Parcelas do Mês</p></div><div><p className="text-base font-bold text-gray-300">{formatCurrency(totalDivida)}</p><p className="text-sm text-gray-400">Dívida Total</p></div></div></div>
            <div className="mb-6 flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="filter-prestacoes" className="block text-sm font-medium text-gray-400 mb-1">Organizar por:</label>
                    <select id="filter-prestacoes" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                        {filterOptions.map(option => (<option key={option} value={option}>{option === 'todos' ? 'Todas as Prestações' : option}</option>))}
                    </select>
                </div>
                <button onClick={() => generatePDF(filteredPrestacoes, filter)} disabled={!isPdfLibReady} className="p-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"><FileDown size={20} /><span>{isPdfLibReady ? 'Relatório' : 'A carregar...'}</span></button>
            </div>
            <h2 className="text-2xl font-bold mb-4">Minhas Prestações</h2>
            <div className="space-y-3">
                {filteredPrestacoes.length > 0 ? filteredPrestacoes.map(item => (<div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center"><div className="flex-grow"><p className="font-semibold text-white">{item.descricao}</p><p className="text-xs text-gray-400">{item.numParcelas} parcelas de {formatCurrency(item.valorParcela)}</p></div><div className="text-right mr-6"><p className="text-sm text-gray-400">Total</p><p className="font-bold text-lg text-yellow-400">{formatCurrency(item.valorTotal)}</p></div><button onClick={() => handleDeleteRequest(item.id, 'prestacao')} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button></div>)) : <p className="text-gray-500 text-center mt-8">Nenhuma prestação encontrada.</p>}
            </div>
        </div>
    );
};
const GastosFixosContent = ({ gastosFixos, formatCurrency, handleDeleteRequest, isPdfLibReady }) => {
    const [filter, setFilter] = useState('todos');
    const generatePDF = (gastos, filter) => {
        if (!isPdfLibReady || !window.jspdf) { console.error("PDF libraries not ready."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const title = `Relatório de Gastos Fixos ${filter !== 'todos' ? `(${filter})` : ''}`;
        doc.text(title, 14, 20);

        const tableColumn = ["Descrição", "Nº de Parcelas", "Valor da Parcela", "Valor Total"];
        const tableRows = gastos.map(item => [
            item.descricao,
            item.numParcelas,
            formatCurrency(item.valorParcela),
            formatCurrency(item.valorTotal)
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            didDrawPage: (data) => {
                let finalY = data.cursor.y + 10;
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                
                const drawTotal = (label, value, yPos) => {
                    const text = `${label}: ${formatCurrency(value)}`;
                    const textWidth = doc.getTextWidth(text);
                    const pageWidth = doc.internal.pageSize.width;
                    const x = pageWidth - data.settings.margin.right - textWidth;
                    doc.text(text, x, yPos);
                }
                
                const totalParcelasMes = gastos.filter(p => { const currentDate = new Date(); const currentYear = currentDate.getFullYear(); const currentMonth = currentDate.getMonth(); const startDate = p.data?.toDate() || new Date(); const monthsPassed = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth()); return monthsPassed >= 0 && monthsPassed < p.numParcelas; }).reduce((acc, p) => acc + p.valorParcela, 0);
                const dividaTotal = gastos.reduce((acc, item) => acc + item.valorTotal, 0);
                
                drawTotal('Total Parcelas do Mês', totalParcelasMes, finalY);
                finalY += 6;
                drawTotal('Dívida Total', dividaTotal, finalY);
            }
        });

        doc.save(`relatorio_gastos_fixos_${filter}.pdf`);
    };
    const filterOptions = useMemo(() => { const descriptions = gastosFixos.map(item => item.descricao); return ['todos', ...new Set(descriptions)]; }, [gastosFixos]);
    const filteredGastos = useMemo(() => { if (filter === 'todos') return gastosFixos; return gastosFixos.filter(item => item.descricao === filter); }, [filter, gastosFixos]);
    const summary = useMemo(() => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const gastosFixosAtivos = filteredGastos.map(p => { const startDate = p.data?.toDate() || new Date(); const monthsPassed = (currentYear - startDate.getFullYear()) * 12 + (currentMonth - startDate.getMonth()); return { ...p, isAtiva: monthsPassed >= 0 && monthsPassed < p.numParcelas, parcelaAtual: monthsPassed + 1 }; }).filter(p => p.isAtiva);
        const gastosFixosMes = gastosFixosAtivos.reduce((acc, p) => acc + p.valorParcela, 0);
        const totalDividaFixa = filteredGastos.reduce((acc, item) => acc + item.valorTotal, 0);
        return { gastosFixosMes, totalDividaFixa };
    }, [filteredGastos]);
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-gray-800 rounded-2xl p-6 mb-6"><h3 className="text-lg font-bold text-white mb-4 text-center">Contabilidade de Gastos Fixos</h3><div className="flex justify-center items-end gap-12 text-center"><div><p className="text-2xl font-bold text-purple-400">{formatCurrency(summary.gastosFixosMes)}</p><p className="text-sm text-gray-400">Total Parcelas do Mês</p></div><div><p className="text-base font-bold text-gray-300">{formatCurrency(summary.totalDividaFixa)}</p><p className="text-sm text-gray-400">Dívida Total</p></div></div></div>
            <div className="mb-6 flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="filter-gastos" className="block text-sm font-medium text-gray-400 mb-1">Organizar por:</label>
                    <select id="filter-gastos" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {filterOptions.map(option => (<option key={option} value={option}>{option === 'todos' ? 'Todos os Lançamentos' : option}</option>))}
                    </select>
                </div>
                <button onClick={() => generatePDF(filteredGastos, filter)} disabled={!isPdfLibReady} className="p-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"><FileDown size={20} /><span>{isPdfLibReady ? 'Relatório' : 'A carregar...'}</span></button>
            </div>
            <h2 className="text-2xl font-bold mb-4">Relatório de Gastos Fixos</h2>
            <div className="space-y-3">
                {filteredGastos.length > 0 ? filteredGastos.map(item => (<div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center"><div className="flex-grow"><p className="font-semibold text-white">{item.descricao}</p><p className="text-xs text-gray-400">{item.numParcelas} parcelas de {formatCurrency(item.valorParcela)}</p></div><div className="text-right mr-6"><p className="text-sm text-gray-400">Total</p><p className="font-bold text-lg text-purple-400">{formatCurrency(item.valorTotal)}</p></div><button onClick={() => handleDeleteRequest(item.id, 'gasto_fixo')} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button></div>)) : <p className="text-gray-500 text-center mt-8">Nenhum gasto fixo encontrado.</p>}
            </div>
        </div>
    );
};
const CalendarioContent = ({ horasExtras, ferias, faltas }) => {
    const [cycleOffset, setCycleOffset] = useState(0);
    const horasExtrasDates = useMemo(() => new Set(horasExtras.map(he => he.data)), [horasExtras]);
    const feriasDates = useMemo(() => {
        const dates = new Set();
        ferias.forEach(f => {
            const start = new Date(Date.parse(f.dataInicio + 'T00:00:00Z'));
            const end = new Date(Date.parse(f.dataFim + 'T00:00:00Z'));
            let current = new Date(start);
            while (current <= end) {
                dates.add(current.toISOString().split('T')[0]);
                current.setUTCDate(current.getUTCDate() + 1);
            }
        });
        return dates;
    }, [ferias]);
    const faltasDates = useMemo(() => new Set(faltas.map(f => f.data)), [faltas]);
    const baseDate = new Date(Date.UTC(2025, 5, 30));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    useEffect(() => {
        const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
        const baseUTC = Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
        const diffTime = todayUTC - baseUTC;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentCycle = Math.floor(diffDays / 28);
        setCycleOffset(currentCycle);
    }, []);
    const getCycleInfo = (offset) => {
        const startDate = new Date(baseDate);
        startDate.setUTCDate(baseDate.getUTCDate() + offset * 28);
        const endDate = new Date(startDate);
        endDate.setUTCDate(startDate.getUTCDate() + 27);
        let paymentDate = new Date(endDate);
        while (paymentDate.getUTCDay() !== 5) { paymentDate.setUTCDate(paymentDate.getUTCDate() + 1); }
        const days = Array.from({ length: 28 }, (_, i) => { const day = new Date(startDate); day.setUTCDate(startDate.getUTCDate() + i); return day; });
        const startMonth = startDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' }).toUpperCase();
        const endMonth = endDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' }).toUpperCase();
        const year = startDate.getUTCFullYear();
        const monthLabel = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
        return { startDate, endDate, paymentDate, days, monthLabel, year };
    };
    const currentCycleInfo = getCycleInfo(cycleOffset);
    const prevCycleInfo = getCycleInfo(cycleOffset - 1);
    const diffTime = today.getTime() - currentCycleInfo.startDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const daysRemaining = 28 - diffDays;
    const progress = (diffDays / 28) * 100;
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-2"><p className="text-sm font-semibold">Progresso do Ciclo</p><p className="text-sm font-semibold">{daysRemaining} dias restantes</p></div>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                <div className="flex justify-between text-center">
                    <div><p className="text-sm text-gray-400">Pagamento Anterior</p><p className="font-bold text-gray-400">{prevCycleInfo.paymentDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p></div>
                    <div><p className="text-sm text-blue-400">Próximo Pagamento</p><p className="text-xl font-bold text-white">{currentCycleInfo.paymentDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCycleOffset(cycleOffset - 1)} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeft size={24} /></button>
                    <div className="text-center"><p className="text-lg font-bold">{currentCycleInfo.monthLabel}</p><p className="text-sm text-gray-400">{currentCycleInfo.year}</p></div>
                    <button onClick={() => setCycleOffset(cycleOffset + 1)} className="p-2 rounded-full hover:bg-gray-700"><ChevronRight size={24} /></button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 mb-2">
                    {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day, index) => (<span key={day} className={index >= 5 ? 'text-blue-400' : ''}>{day}</span>))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {currentCycleInfo.days.map((day, index) => {
                        const dayString = day.toISOString().split('T')[0];
                        const isToday = day.getTime() === today.getTime();
                        const isHoraExtra = horasExtrasDates.has(dayString);
                        const isFerias = feriasDates.has(dayString);
                        const isFalta = faltasDates.has(dayString);
                        const dayOfWeek = day.getUTCDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        let dayClasses = 'aspect-square flex items-center justify-center rounded-lg border border-gray-700/50 transition-colors';
                        if (isWeekend && !isToday && !isHoraExtra && !isFerias && !isFalta) { dayClasses += ' bg-gray-700/40'; }
                        if (isFerias) { dayClasses += ' bg-teal-600 text-white font-bold'; } else if (isFalta) { dayClasses += ' bg-orange-600 text-white font-bold'; } else if (isHoraExtra) { dayClasses += ' bg-indigo-600 text-white font-bold'; }
                        if (isToday) { dayClasses += ' bg-blue-600 text-white font-bold ring-2 ring-blue-400 shadow-lg'; }
                        return (<div key={index} className={dayClasses}>{day.getUTCDate()}</div>);
                    })}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-700/50">
                    <h4 className="text-center text-sm font-bold text-gray-400 mb-4">LEGENDA</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-600"></div><span>Dia Atual</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-teal-600"></div><span>Férias</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-600"></div><span>Falta</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-indigo-600"></div><span>Hora Extra</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Componente Principal do Aplicativo ---
export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Visão Geral');
    const [transacoes, setTransacoes] = useState([]);
    const [cartoes, setCartoes] = useState([]);
    const [prestacoes, setPrestacoes] = useState([]);
    const [gastosFixos, setGastosFixos] = useState([]);
    const [faltas, setFaltas] = useState([]);
    const [ferias, setFerias] = useState([]);
    const [horasExtras, setHorasExtras] = useState([]);
    const [modalType, setModalType] = useState(null);
    const [isSuccessVisible, setIsSuccessVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '' });
    const [isPdfLibReady, setIsPdfLibReady] = useState(false);

    // CORREÇÃO: Lógica de carregamento dos scripts de PDF
    useEffect(() => {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.async = true;

        jspdfScript.onload = () => {
            // Só carrega o autotable DEPOIS que o jspdf principal estiver pronto
            const jspdfAutotableScript = document.createElement('script');
            jspdfAutotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
            jspdfAutotableScript.async = true;

            jspdfAutotableScript.onload = () => {
                setIsPdfLibReady(true); // Marca como pronto SÓ quando AMBOS estiverem carregados
            };
            document.head.appendChild(jspdfAutotableScript);
        };
        
        document.head.appendChild(jspdfScript);

        return () => {
            // Lógica de limpeza (opcional, mas boa prática)
        }
    }, []);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user || !db) {
            const statesToClear = [setTransacoes, setCartoes, setPrestacoes, setGastosFixos, setFaltas, setFerias, setHorasExtras];
            statesToClear.forEach(setter => setter([]));
            return;
        }
        const userId = user.uid;
        const collections = {
            transacoes: setTransacoes, cartoes: setCartoes, prestacoes: setPrestacoes,
            gastos_fixos: setGastosFixos, faltas: setFaltas, ferias: setFerias, hora_extras: setHorasExtras
        };
        const unsubscribers = Object.entries(collections).map(([name, setter]) => {
            const q = query(collection(db, `users/${userId}/${name}`));
            return onSnapshot(q, (snapshot) => {
                const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(fetched);
            });
        });
        return () => unsubscribers.forEach(unsub => unsub());
    }, [user]);

    const handleLogin = async () => { if (auth && provider) await signInWithPopup(auth, provider).catch(console.error); };
    const handleLogout = async () => { if (auth) await signOut(auth).catch(console.error); };

    const formatCurrency = (value) => (typeof value === 'number' ? value : 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
    const showSuccessMessage = () => { setIsSuccessVisible(true); setTimeout(() => setIsSuccessVisible(false), 3000); };
    const showCustomAlert = (title, message) => setAlertInfo({ isOpen: true, title, message });
    const handleLaunchTypeSelect = (type) => setModalType(type);
    const handleDeleteRequest = (id, type) => setItemToDelete({ id, type });
    const handleConfirmDelete = async () => {
        if (!itemToDelete || !user || !db) return;
        const { id, type } = itemToDelete;
        let collectionName;
        switch(type) {
            case 'transacao': collectionName = 'transacoes'; break;
            case 'cartao': collectionName = 'cartoes'; break;
            case 'prestacao': collectionName = 'prestacoes'; break;
            case 'gasto_fixo': collectionName = 'gastos_fixos'; break;
            case 'falta': collectionName = 'faltas'; break;
            case 'ferias': collectionName = 'ferias'; break;
            case 'hora_extra': collectionName = 'hora_extras'; break;
            default: return;
        }
        await deleteDoc(doc(db, `users/${user.uid}/${collectionName}`, id));
        setItemToDelete(null);
    };
    
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'Visão Geral': return <VisaoGeralContent transacoes={transacoes} cartoes={cartoes} prestacoes={prestacoes} formatCurrency={formatCurrency} isPdfLibReady={isPdfLibReady} />;
            case 'Lançamentos': return <LaunchCenterContent onLaunchTypeSelect={handleLaunchTypeSelect} />;
            case 'Transações': return <TransacoesContent transacoes={transacoes} formatCurrency={formatCurrency} handleDeleteRequest={handleDeleteRequest} isPdfLibReady={isPdfLibReady} />;
            case 'Cartões': return <CartoesContent cartoes={cartoes} formatCurrency={formatCurrency} handleDeleteRequest={handleDeleteRequest} isPdfLibReady={isPdfLibReady} />;
            case 'Prestações': return <PrestacoesContent prestacoes={prestacoes} formatCurrency={formatCurrency} handleDeleteRequest={handleDeleteRequest} isPdfLibReady={isPdfLibReady} />;
            case 'Gastos Fixos': return <GastosFixosContent gastosFixos={gastosFixos} formatCurrency={formatCurrency} handleDeleteRequest={handleDeleteRequest} isPdfLibReady={isPdfLibReady} />;
            case 'Calendário': return <CalendarioContent horasExtras={horasExtras} ferias={ferias} faltas={faltas} />;
            case 'Faltas': return (<div className="max-w-4xl mx-auto p-4 sm:p-6"><div className="bg-gray-800 rounded-2xl p-6 mb-6"><h3 className="text-lg font-bold text-white mb-4 text-center">Contabilidade de Faltas</h3><div className="flex justify-center gap-12 text-center"><div><p className="text-2xl font-bold text-orange-400">{faltas.length}</p><p className="text-sm text-gray-400">Total de Faltas</p></div></div></div><h2 className="text-2xl font-bold mb-4">Relatório de Faltas</h2><div className="space-y-3">{faltas.length > 0 ? faltas.map(item => { const dateParts = item.data.split('-'); const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])); const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }; const formattedDate = new Intl.DateTimeFormat('pt-BR', options).format(date); const finalDate = formattedDate.replace(/de /g, '').replace(/,/g, ' -').replace(/\s+/g, ' '); const capitalizedDate = finalDate.charAt(0).toUpperCase() + finalDate.slice(1); return (<div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center"><div className="flex-grow"><p className="font-semibold text-white">{capitalizedDate}</p></div><button onClick={() => handleDeleteRequest(item.id, 'falta')} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button></div>); }) : <p className="text-gray-500 text-center mt-8">Nenhum registo de falta encontrado.</p>}</div></div>);
            case 'Férias':
                const hoje = new Date(); let anoCiclo = hoje.getMonth() >= 3 ? hoje.getFullYear() : hoje.getFullYear() - 1; const inicioCiclo = new Date(anoCiclo, 3, 1); const fimCiclo = new Date(anoCiclo + 1, 2, 31);
                const feriasNoCiclo = ferias.filter(f => { const dataInicioFerias = new Date(Date.parse(f.dataInicio + 'T00:00:00Z')); return dataInicioFerias >= inicioCiclo && dataInicioFerias <= fimCiclo; });
                const diasTirados = feriasNoCiclo.reduce((acc, f) => acc + f.diasTirados, 0); const diasRestantes = 20 - diasTirados;
                return (<div className="max-w-4xl mx-auto p-4 sm:p-6">
                    <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">Contabilidade de Férias</h3>
                        <p className="text-sm text-gray-400 mb-4 text-center">Ciclo: {inicioCiclo.toLocaleDateString('pt-BR')} - {fimCiclo.toLocaleDateString('pt-BR')}</p>
                        <div className="flex justify-center gap-12 text-center">
                            <div><p className="text-2xl font-bold text-teal-400">{diasTirados}</p><p className="text-sm text-gray-400">Dias Tirados</p></div>
                            <div><p className="text-2xl font-bold text-white">{diasRestantes}</p><p className="text-sm text-gray-400">Dias Restantes</p></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Relatório de Férias</h2>
                    <div className="space-y-3">{ferias.length > 0 ? ferias.map(item => { const dataInicioF = new Date(Date.parse(item.dataInicio + 'T00:00:00Z')); const dataFimF = new Date(Date.parse(item.dataFim + 'T00:00:00Z')); const formataData = (d) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); const periodo = item.dataInicio === item.dataFim ? formataData(dataInicioF) : `${formataData(dataInicioF)} - ${formataData(dataFimF)}`; return (<div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center"><div className="flex-grow"><p className="font-semibold text-white">{periodo}</p><p className="text-xs text-gray-400">{item.diasTirados} dia(s) útil(eis)</p></div><button onClick={() => handleDeleteRequest(item.id, 'ferias')} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button></div>); }) : <p className="text-gray-500 text-center mt-8">Nenhum registo de férias encontrado.</p>}</div>
                </div>);
            case 'Horas Extras':
                const totalHorasExtras = horasExtras.reduce((acc, item) => acc + item.quantidadeHoras, 0);
                return (
                    <div className="max-w-4xl mx-auto p-4 sm:p-6">
                        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-white mb-4 text-center">Contabilidade de Horas Extras</h3>
                            <div className="flex justify-center gap-12 text-center">
                                <div><p className="text-2xl font-bold text-indigo-400">{totalHorasExtras.toFixed(2)}</p><p className="text-sm text-gray-400">Total de Horas</p></div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Relatório de Horas Extras</h2>
                        <div className="space-y-3">{horasExtras.length > 0 ? horasExtras.map(item => { const dateParts = item.data.split('-'); const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])); const options = { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }; const formattedDate = new Intl.DateTimeFormat('pt-BR', options).format(date); return (<div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center"><div className="flex-grow"><p className="font-semibold text-white">{formattedDate}</p></div><span className="font-bold text-lg mr-6 text-indigo-400">{item.quantidadeHoras.toFixed(2)} horas</span><button onClick={() => handleDeleteRequest(item.id, 'hora_extra')} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20} /></button></div>); }) : <p className="text-gray-500 text-center mt-8">Nenhum registo de horas extras encontrado.</p>}</div>
                    </div>
                );
            default: return <div className="p-6">Conteúdo para {activeTab}</div>;
        }
    };

    if (loading) return <div className="bg-gray-900 min-h-screen" />;
    if (!user) return <LoginScreen onLogin={handleLogin} />;

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'); .animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .animate-slide-down-fade { animation: slideDownFadeOut 3s ease-in-out forwards; } @keyframes slideDownFadeOut { 0% { transform: translate(-50%, -150%); opacity: 0; } 15% { transform: translate(-50%, 0); opacity: 1; } 85% { transform: translate(-50%, 0); opacity: 1; } 100% { transform: translate(-50%, -150%); opacity: 0; } }`}</style>
            {isMenuOpen && <MainMenu user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} setIsMenuOpen={setIsMenuOpen} />}
            <ReceitaModal isOpen={modalType === 'receita'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} />
            <DespesaModal isOpen={modalType === 'despesa'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} />
            <CartaoModal isOpen={modalType === 'cartao'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} />
            <PrestacaoModal isOpen={modalType === 'prestacao'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} />
            <GastoFixoModal isOpen={modalType === 'gasto_fixo'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} />
            <FaltaModal isOpen={modalType === 'falta'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} faltas={faltas} showCustomAlert={showCustomAlert} />
            <FeriasModal isOpen={modalType === 'ferias'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} />
            <HoraExtraModal isOpen={modalType === 'hora_extra'} onClose={() => setModalType(null)} userId={user.uid} showSuccessMessage={showSuccessMessage} />
            <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} type={itemToDelete?.type} />
            <AlertModal isOpen={alertInfo.isOpen} onClose={() => setAlertInfo({ isOpen: false, title: '', message: '' })} title={alertInfo.title} message={alertInfo.message} />
            {isSuccessVisible && (<div className="fixed top-6 left-1/2 -translate-x-1/2 bg-gradient-to-br from-green-500 to-green-600 text-white py-3 px-6 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-down-fade z-[70]"><CheckCircle size={28} /><div className="flex flex-col text-center"><span className="font-semibold leading-tight">Lançamento feito com sucesso</span></div></div>)}
            <header className="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-40 p-4 flex items-center justify-between shadow-lg">
                <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-md hover:bg-gray-700 transition-colors"><Menu size={24} /></button>
                <h1 className="text-xl font-bold">{activeTab}</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main><div className="pb-20">{renderActiveTabContent()}</div></main>
        </div>
    );
}

const MainMenu = ({ user, onLogout, activeTab, setActiveTab, setIsMenuOpen }) => {
    const MenuItem = ({ icon, label, isTab }) => {
        const isActive = activeTab === label;
        return (
            <button
                onClick={() => {
                    if (isTab) setActiveTab(label);
                    setIsMenuOpen(false);
                }}
                className={`w-full text-left flex items-center gap-4 px-4 py-2 rounded-lg text-lg transition-all duration-200 ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
                {icon}<span>{label}</span>
            </button>
        );
    };
    return (
        <div className="fixed inset-0 bg-gray-900 z-50 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Menu Principal</h2>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white"><X size={32} /></button>
            </div>
            {user && (
                <div className="flex items-center gap-4 p-4 mb-4 bg-gray-800 rounded-lg">
                    <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full" />
                    <div>
                        <p className="font-semibold text-white">{user.displayName}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                </div>
            )}
            <nav className="flex flex-col gap-1 flex-grow">
                 <MenuItem icon={<LayoutDashboard size={24} />} label="Visão Geral" isTab />
                 <MenuItem icon={<Plus size={24} />} label="Lançamentos" isTab />
                 <MenuItem icon={<List size={24} />} label="Transações" isTab />
                 <MenuItem icon={<CreditCard size={24} />} label="Cartões" isTab />
                 <MenuItem icon={<Repeat size={24} />} label="Prestações" isTab />
                 <MenuItem icon={<Archive size={24} />} label="Gastos Fixos" isTab />
                 <MenuItem icon={<Calendar size={24} />} label="Calendário" isTab />
                 <p className="text-gray-500 font-bold text-sm mt-4 mb-2 px-4">CONTROLO DE PONTO</p>
                 <MenuItem icon={<XCircle size={24} />} label="Faltas" isTab />
                 <MenuItem icon={<Plane size={24} />} label="Férias" isTab />
                 <MenuItem icon={<Clock size={24} />} label="Horas Extras" isTab />
            </nav>
            <button
                onClick={onLogout}
                className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg text-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors mt-auto"
            >
                <LogOut size={24} />
                <span>Sair</span>
            </button>
        </div>
    );
};
