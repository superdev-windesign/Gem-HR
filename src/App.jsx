import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeProfile from './pages/EmployeeProfile'
import Payroll from './pages/Payroll'
import Documents from './pages/Documents'
import Invoices from './pages/Invoices'
import Clients from './pages/Clients'
import ClientProfile from './pages/ClientProfile'
import Expenses from './pages/Expenses'
import CustomPayments from './pages/CustomPayments'
import Finance from './pages/Finance'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeProfile />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="documents" element={<Documents />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientProfile />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="custom-payments" element={<CustomPayments />} />
        <Route path="finance" element={<Finance />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
