import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/AuthProvider.tsx';
import { Budget } from '@/types/Budget';
import formatDate from '@/util/formatDate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { calculateRemainingBudget } from '@/util/calculateRemainingBudget';

interface Expense {
  amount: number;
  date: string;
  description: string;
  categoryId: string | null;
  budgetId: string;
}

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().nullable()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const LoadingState = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 max-w-4xl pt-20">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-28" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-secondary">
                  <CardContent className="flex justify-between items-center p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Skeleton className="h-10 w-20 mt-6" />
      </div>
    </>
  );
};

const Details = () => {
  const { id } = useParams<{ id: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      categoryId: null
    }
  });

  const fetchBudgetDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/budget/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      setBudget(data);
    } catch (error) {
      console.error('Error fetching budget details:', error);
    }
  };

  useEffect(() => {
    fetchBudgetDetails();
  }, [id, token]);

  const handleAddExpense = async (values: ExpenseFormData) => {
    try {
      const response = await fetch(`http://localhost:8080/api/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...values, budgetId: id })
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      await fetchBudgetDetails();
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Expense added successfully',
        className: 'bg-green-500 text-white'
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        variant: 'destructive',
        title: 'Error Adding Expense',
        description: 'Please check your input and try again.',
        action: (
          <ToastAction altText="Try again" onClick={() => setIsDialogOpen(true)}>
            Try again
          </ToastAction>
        )
      });
    }
  };

  if (!budget) {
    return <LoadingState />;
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 max-w-4xl pt-20">
        <h1 className="text-2xl font-bold mb-4">Budget Details</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">{budget.name}</CardTitle>
            <CardDescription>Budget Overview</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{budget.amount} zł</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="text-md">
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
              </p>
            </div>
            <div className="col-span-2 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Budget</p>
                  <p
                    className={`text-2xl font-bold ${
                      calculateRemainingBudget(budget) < 0 ? 'text-destructive' : 'text-green-500'
                    }`}>
                    {calculateRemainingBudget(budget)} zł
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {budget.expenses.reduce((sum, expense) => sum + expense.amount, 0)} zł
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Expense</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Add a new expense to your budget. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddExpense)} className="space-y-4">
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
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter expense description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter category ID"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Add Expense
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {budget.expenses.length > 0 ? (
                <div className="space-y-4">
                  {budget.expenses.map((expense: Expense, index: number) => (
                    <Card key={index} className="bg-secondary">
                      <CardContent className="flex justify-between items-center p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(expense.date)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-lg">
                          {expense.amount} zł
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No expenses available</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Button className="mt-6 text-white" variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>
    </>
  );
};

export default Details;
