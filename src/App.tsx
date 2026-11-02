import React from 'react';

import {BrowserRouter, Routes, Route} from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import Navigation from './components/Navigation';
import AccountsPage from './pages/AccountsPage';
import BudgetPage from './pages/BudgetPage';
import CashFlowPage from './pages/CashFlowPage';
import MainPage from './pages/MainPage';
import TransactionsPage from './pages/TransactionsPage';
import SignUp from "./pages/SignUp.tsx";
import Login from "./pages/Login.tsx";

const App: React.FC = () => {
    return (
    <BrowserRouter>
      <AuthProvider>
        <Navigation />
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route element={<RequireAuth />}>
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/cashflow" element={<CashFlowPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
            </Route>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    )
}

export default App;
