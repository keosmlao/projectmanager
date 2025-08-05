import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import SaleAdminPage from "./pages/SaleAdminPage";
import SaleManagerPage from "./pages/SaleManagerPage";
import ServiceAdminPage from "./pages/ServiceAdminPage";
import ServiceManagerPage from "./pages/ServiceManagerPage";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./ProtectedRoute";
import ProjectList from "./pages/saleadmin/ProjectList"
import CreateProject from "./pages/saleadmin/createproject"
import RequestProjectCreation from "./pages/saleadmin/RequestProjectCreation"
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/sale-admin"
          element={
            <ProtectedRoute allowRoles={["sale_admin"]}>
              <SaleAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sale-admin/listproject"
          element={
            <ProtectedRoute allowRoles={["sale_admin"]}>
              <ProjectList />
            </ProtectedRoute>
          }
        />
        {/* New route for project creation request */}
        <Route path="/sale-admin/request-project-creation/:projectId" element={<RequestProjectCreation />} />
        {/* Optional: A route without projectId if you want to allow requests without linking to an existing one */}
        <Route path="/sale-admin/request-project-creation" element={<RequestProjectCreation />} />
        <Route
          path="/sale-admin/create-project"
          element={
            <ProtectedRoute allowRoles={["sale_admin"]}>
              <CreateProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sale-manager"
          element={
            <ProtectedRoute allowRoles={["sale_manager"]}>
              <SaleManagerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/service-admin"
          element={
            <ProtectedRoute allowRoles={["service_admin"]}>
              <ServiceAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/service-manager"
          element={
            <ProtectedRoute allowRoles={["service_manager"]}>
              <ServiceManagerPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
