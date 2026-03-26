import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Shield, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (email) {
        setSuccess(true);
      } else {
        setError('Please enter your email address');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
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
              Reset your password
            </CardTitle>
            <CardDescription className="text-slate-400">
              {success 
                ? "We've sent you a reset link"
                : "Enter your email address and we'll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>

          {success ? (
            <>
              <CardContent className="space-y-4">
                <Alert className="bg-green-900/20 border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                  </AlertDescription>
                </Alert>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Link to="/" className="w-full">
                  <Button variant="outline" className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  className="w-full text-blue-400 hover:text-blue-300 hover:bg-transparent"
                  onClick={() => setSuccess(false)}
                >
                  Didn't receive the email? Try again
                </Button>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                      required
                      aria-required="true"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Link to="/" className="w-full">
                  <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          Having trouble? Contact support@phishguard.com
        </p>
      </motion.div>
    </div>
  );
}
