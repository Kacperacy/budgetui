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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function Login() {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const { login } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Please check your credentials and try again.',
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
        <h2 className="text-lg font-medium">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
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
                      placeholder="Enter your password"
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
            Sign in
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default Login;
