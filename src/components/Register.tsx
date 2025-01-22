import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form.tsx';
import { useAuth } from '@/hooks/AuthProvider.tsx';
import { useToast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function Register() {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const { register, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (values: RegisterFormData) => {
    try {
      const { email, password } = values;
      const registerSuccess = await register({ email, password });

      if (registerSuccess) {
        try {
          await login({ email, password });
          toast({
            title: 'Success',
            description: 'Account created successfully',
            className: 'bg-green-500 text-white'
          });
        } catch (loginError) {
          console.error('Login error after registration:', loginError);
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description:
              'Registration successful but login failed. Please try logging in manually.',
            action: (
              <ToastAction altText="Try again" onClick={() => navigate('/')}>
                Go to login
              </ToastAction>
            )
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'An account with this email may already exist.',
        action: (
          <ToastAction altText="Try again" onClick={() => form.reset()}>
            Try again
          </ToastAction>
        )
      });
    }
  };

  return (
    <div className="space-y-6 min-w-[320px] min-h-[400px]">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Create an account</h2>
        <p className="text-sm text-muted-foreground">Enter your details to get started</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4 min-h-[240px]">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="min-w-full">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      className="bg-background w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="min-w-full">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a password"
                      className="bg-background w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="min-w-full">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      className="bg-background w-full"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default Register;
