import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const showNotificationToast = (message) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored"
  });
};
