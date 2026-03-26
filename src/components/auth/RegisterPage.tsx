import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useCreateUser, useCurrentUser } from '@/context/UsersContext';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Shield, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';

export function RegisterPage() {
  const navigate = useNavigate();
  const { createUser } = useCreateUser();
  const { setCurrentUserId, refreshUsers } = useCurrentUser();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (passwordStrength < 2) {
      setError('Password must be at least 8 characters with letters and numbers.');
      return;
    }

    setIsLoading(true);

    try {
      const created = await createUser({
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      setCurrentUserId(created.id);
      await refreshUsers();
      toast.success('Account created! Welcome to PhishGuard 🎉');
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registration failed. Try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-2xl">
                <Shield className="h-10 w-10 text-white" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Create your account
            </CardTitle>
            <CardDescription className="text-slate-400">
              Join PhishGuard and start learning cybersecurity
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    required
                    aria-required="true"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    required
                    aria-required="true"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    required
                    aria-required="true"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                </div>

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength
                              ? level <= 2
                                ? 'bg-red-500'
                                : level === 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-slate-700'
                          }`}
                          role="progressbar"
                          aria-valuenow={passwordStrength}
                          aria-valuemin={0}
                          aria-valuemax={4}
                          aria-label="Password strength indicator"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      Password strength: {passwordStrength <= 2 ? 'Weak' : passwordStrength === 3 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" aria-hidden="true" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    required
                    aria-required="true"
                    autoComplete="new-password"
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" aria-hidden="true" />
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                  className="mt-1 border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  aria-required="true"
                />
                <Label htmlFor="terms" className="text-sm text-slate-400 leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <Link to="#" className="text-blue-400 hover:text-blue-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="#" className="text-blue-400 hover:text-blue-300">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
