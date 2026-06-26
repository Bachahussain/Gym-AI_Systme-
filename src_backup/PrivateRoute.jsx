import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  if(localStorage.getItem("token")){
    return children;
  }
  return <Navigate to="/" />;
};
export default PrivateRoute;