import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, clearError } from "../store/authSlice";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Spinner,
} from "../components/common";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value) {
          return "Email is required";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address";
        }
        if (
          !value.endsWith("@aroonlamai.com") &&
          !value.includes("@aroonlamai.com")
        ) {
          return "Please use your staff email address";
        }
        return null;

      case "password":
        if (!value) {
          return "Password is required";
        }
        if (value.length < 6) {
          return "Password must be at least 6 characters";
        }
        return null;

      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);
      setValidationErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      !validateField("email", formData.email) &&
      !validateField("password", formData.password)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = { email: true, password: true };
    setTouched(allTouched);

    // Validate all fields
    const errors = {
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    };
    setValidationErrors(errors);

    // Submit if form is valid
    if (!errors.email && !errors.password) {
      const result = await dispatch(login(formData));
      if (login.fulfilled.match(result)) {
        navigate("/");
      }
    }
  };

  const hasError = (field) => touched[field] && validationErrors[field];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Aroon Lamai</h1>
            <p className="text-sm text-muted-foreground">Waitstaff Portal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={hasError("email") ? "text-destructive" : ""}
              >
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="staff@aroonlamai.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  hasError("email")
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                required
                autoComplete="email"
                disabled={loading}
              />
              {hasError("email") && (
                <p className="text-xs text-destructive mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className={hasError("password") ? "text-destructive" : ""}
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  hasError("password")
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                required
                autoComplete="current-password"
                disabled={loading}
              />
              {hasError("password") && (
                <p className="text-xs text-destructive mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isFormValid()}
              variant={!isFormValid() ? "secondary" : "primary"}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Demo Credentials
            </p>
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>
                <strong>Email:</strong> staff@aroonlamai.com
              </p>
              <p>
                <strong>Password:</strong> password123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
