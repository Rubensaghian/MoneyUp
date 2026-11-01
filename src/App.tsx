import React from 'react';

import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
import AccountsPage from './pages/AccountsPage';
import BudgetPage from './pages/BudgetPage';
import CashFlowPage from './pages/CashFlowPage';
import MainPage from './pages/MainPage';
import TransactionsPage from './pages/TransactionsPage';

const App: React.FC = () => {
    return (
    <BrowserRouter>

        <nav>
            <Link to="/">Home</Link>
            <Link to="/accounts">Accounts</Link>
            <Link to="/budget">Budget</Link>
            <Link to="/cashflow">Cash Flow</Link>
            <Link to="/transactions">Transactions</Link>
            <Link to="/signup">Sign Up</Link>
        </nav>

        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/cashflow" element={<CashFlowPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/signup" element={<SignUp.tsx />} />
        </Routes>

    </BrowserRouter>
    )
}

export default App;