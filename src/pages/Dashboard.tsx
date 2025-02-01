import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/AuthProvider.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import formatDate from '@/util/formatDate.ts';
import { Budget } from '@/types/Budget';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPortal } from 'react-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateRemainingBudget } from '@/util/calculateRemainingBudget';

const budgetSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required')
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date can't be before start date",
    path: ['endDate']
  });

type BudgetFormData = z.infer<typeof budgetSchema>;

export const CreateBudgetDialog = ({
  open,
  onOpenChange,
  onSubmit,
  form
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BudgetFormData) => Promise<void>;
  form: UseFormReturn<BudgetFormData>;
}) => {
  return createPortal(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Budget</DialogTitle>
          <DialogDescription>
            Add a new budget to track your expenses. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter budget name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Total budget amount in PLN</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Create Budget
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>,
    document.body
  );
};

const SkeletonBudgetCard = () => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      amount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await fetch('http://localhost:8080/api/budget', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch budgets');
        }
        const data = await response.json();
        setBudgets(data);
      } catch (error) {
        console.error('Error fetching budgets:', error);
        setError('Failed to load budgets');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load budgets. Please try again later.',
          action: (
            <ToastAction altText="Retry" onClick={() => fetchBudgets()}>
              Retry
            </ToastAction>
          )
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgets();
  }, [token, toast]);

  const handleAddBudget = async (values: BudgetFormData) => {
    try {
      const response = await fetch('http://localhost:8080/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      // Read the response body
      const newBudget = await response.json();

      // Handle both successful creation (201) and other responses
      if (response.status === 201 && newBudget) {
        setBudgets((prevBudgets) => [...prevBudgets, newBudget]);
        setIsDialogOpen(false);
        form.reset();

        toast({
          title: 'Success',
          description: 'Budget created successfully',
          className: 'bg-green-500 text-white'
        });
      } else {
        // If we got here, something went wrong
        throw new Error(newBudget.message || 'Failed to create budget');
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        variant: 'destructive',
        title: 'Error Creating Budget',
        description:
          error instanceof Error ? error.message : 'Please check your input and try again.',
        action: (
          <ToastAction altText="Try again" onClick={() => setIsDialogOpen(true)}>
            Try again
          </ToastAction>
        )
      });
    }
  };

  const handleViewDetails = (budget: Budget) => {
    navigate(`/details/${budget.id}`);
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 max-w-7xl pt-20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-primary-foreground">Manage your budgets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoading ? (
            <>
              {[...Array(6)].map((_, index) => (
                <SkeletonBudgetCard key={index} />
              ))}
            </>
          ) : error ? (
            <div className="col-span-full text-center py-8">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-destructive">Error Loading Budgets</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => window.location.reload()}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2">
                      <path d="M21 2v6h-6" />
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                      <path d="M3 22v-6h6" />
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {budgets.map((budget, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{budget.name}</CardTitle>
                    <CardDescription>
                      {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Budget</span>
                        <span className="text-2xl font-bold">{budget.amount} zł</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Remaining</span>
                        <span
                          className={`text-lg font-semibold ${
                            calculateRemainingBudget(budget) < 0
                              ? 'text-destructive'
                              : 'text-green-500'
                          }`}>
                          {calculateRemainingBudget(budget)} zł
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => handleViewDetails(budget)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Card
                className="hover:shadow-lg transition-shadow border-dashed cursor-pointer h-full"
                onClick={() => setIsDialogOpen(true)}>
                <CardContent className="flex flex-col items-center justify-center h-full space-y-6 p-6">
                  <div className="rounded-full bg-secondary w-16 h-16 flex items-center justify-center">
                    <span className="text-4xl leading-none mb-1">+</span>
                  </div>
                  <CardDescription>Create New Budget</CardDescription>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {!isLoading && !error && budgets.length === 0 && (
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle>No Budgets Yet</CardTitle>
              <CardDescription>
                Create your first budget to start managing your finances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsDialogOpen(true)}>
                <span className="mr-2">+</span>
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Add a new budget to track your expenses. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddBudget)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter budget name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Create Budget
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Dashboard;
