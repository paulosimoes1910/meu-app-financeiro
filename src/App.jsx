// TESTE DE MUDANÇA PARA O GIT
// import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, query, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
// IMPORTAÇÕES NOVAS para o Login com Google
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LayoutDashboard, Plus, List, CreditCard, Repeat, Calendar, XCircle, Plane, Clock, Menu, X, ArrowUp, ArrowDown, CheckCircle, Trash2, AlertTriangle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Eye, EyeOff, Archive, FileDown, LogIn, LogOut } from 'lucide-react';

// --- Configuração do Firebase (NÃO MUDA) ---
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
// NOVO: Provedor de login do Google
const provider = isFirebaseConfigValid ? new GoogleAuthProvider() : null;

// --- NOVO: Componente de Tela de Login ---
const LoginScreen = ({ onLogin }) => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Bem-vindo(a)!</h1>
            <p className="text-gray-400 mb-8">Faça login para gerenciar suas finanças.</p>
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

// --- Componente Modal de Alerta (NÃO MUDA) ---
const AlertModal = ({ isOpen, onClose, title, message }) => { if (!isOpen) return null; return (<div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm text-white shadow-2xl text-center" onClick={(e) => e.stopPropagation()}><div className="mx-auto bg-yellow-900/50 h-16 w-16 flex items-center justify-center rounded-full"><AlertTriangle size={40} className="text-yellow-400" /></div><h2 className="text-xl font-bold mt-6 mb-2">{title}</h2><p className="text-sm text-gray-400 mb-8">{message}</p><div className="flex justify-center"><button onClick={onClose} className="py-2 px-8 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors font-semibold">OK</button></div></div></div>); };

// --- Componente Modal de Confirmação para Deletar (NÃO MUDA) ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, type = 'transacao' }) => {
    if (!isOpen) return null;
    const title = "Tem certeza que deseja Eliminar?";
    let message;
    switch (type) {
        case 'cartao': message = "O cartão e sua fatura serão removidos permanentemente."; break;
        case 'prestacao': message = "A prestação e todos os seus detalhes serão removidos permanentemente."; break;
        case 'gasto_fixo': message = "Este gasto fixo será removido permanentemente."; break;
        case 'falta': message = "Este registro de falta será removido permanentemente."; break;
        case 'ferias': message = "Este período de férias será removido permanentemente."; break;
        case 'hora_extra': message = "Este registo de horas extras será removido permanentemente."; break;
        default: message = "Essa ação não pode ser desfeita. A transação será removida permanentemente.";
    }
    return (<div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm text-white shadow-2xl text-center" onClick={(e) => e.stopPropagation()}><div className="mx-auto bg-red-900/50 h-16 w-16 flex items-center justify-center rounded-full"><AlertTriangle size={40} className="text-red-400" /></div><h2 className="text-xl font-bold mt-6 mb-2">{title}</h2><p className="text-sm text-gray-400 mb-8">{message}</p><div className="flex justify-center gap-4"><button onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors font-semibold">Cancelar</button><button onClick={onConfirm} className="py-2 px-6 bg-red-600 hover:bg-red-500 rounded-lg transition-colors font-semibold">Deletar</button></div></div></div>);
};

// --- Todos os outros componentes (Modais, VisaoGeralContent, etc.) permanecem os mesmos ---
// ... (O código dos outros componentes que não mudaram está aqui, mas foi omitido para encurtar a resposta)
// --- O código completo está no arquivo final ---

// --- Componente Principal do Aplicativo (ATUALIZADO) ---
export default function App() {
    const [user, setUser] = useState(null); // NOVO: Guarda o objeto do usuário, não apenas o ID
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

    // ATUALIZADO: Lógica de autenticação
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); // Guarda o usuário completo (ou null se deslogado)
        });
        return () => unsubscribe(); // Limpa o listener ao desmontar
    }, []);

    // ATUALIZADO: Lógica de busca de dados, agora depende do user.uid
    useEffect(() => {
        if (!user || !db) {
            // Limpa os dados se o usuário deslogar
            setTransacoes([]);
            setCartoes([]);
            setPrestacoes([]);
            // ... limpe os outros estados também
            return;
        }

        const userId = user.uid;
        const collections = {
            transacoes: setTransacoes,
            cartoes: setCartoes,
            prestacoes: setPrestacoes,
            gastos_fixos: setGastosFixos,
            faltas: setFaltas,
            ferias: setFerias,
            hora_extras: setHorasExtras
        };
        
        // ... (resto da lógica de busca de dados não muda)
        const unsubscribers = Object.entries(collections).map(([name, setter]) => {
            const q = query(collection(db, `users/${userId}/${name}`));
            return onSnapshot(q, (snapshot) => {
                const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // ... (lógica de ordenação não muda)
                setter(fetched);
            }, (error) => console.error(`Erro ao buscar ${name}:`, error));
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user]); // Roda este efeito sempre que o 'user' mudar (login/logout)

    // NOVO: Funções de Login e Logout
    const handleLogin = async () => {
        if (!auth || !provider) return;
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Erro ao fazer login com Google:", error);
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    // O resto do código (formatCurrency, useEffect do PDF, etc.) não muda
    // ...

    // ATUALIZADO: Se não houver usuário, mostra a tela de login
    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }
    
    // Se houver um usuário, mostra o aplicativo normal
    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            {/* ... (O HTML/JSX do seu app principal não muda muito) ... */}
            {/* NOVO: Adicionamos o botão de Logout no menu */}
            <MainMenu onLogout={handleLogout} user={user} /> 
            {/* ... (O resto do seu return JSX) ... */}
        </div>
    );
}

// ATUALIZADO: O menu agora tem um botão de Logout e mostra o nome/foto do usuário
const MainMenu = ({ onLogout, user }) => (
    <div className="fixed inset-0 bg-gray-900 z-50 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Menu Principal</h2>
            <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white"><X size={32} /></button>
        </div>
        
        {/* NOVO: Mostra informações do usuário logado */}
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
            {/* ... (Seus MenuItems não mudam) ... */}
        </nav>
        
        {/* NOVO: Botão de Logout */}
        <button 
            onClick={onLogout}
            className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg text-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
            <LogOut size={24} />
            <span>Sair</span>
        </button>
    </div>
);

// --- O resto dos seus componentes (VisaoGeralContent, CalendarioContent, etc.) não precisa de grandes mudanças ---
// --- Eles vão funcionar normalmente com os dados que o App principal busca ---