import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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

interface Expense {
  amount: number;
  date: string;
  description: string;
  categoryId: string | null;
  budgetId: string;
}

const Details = () => {
  const { logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [newExpense, setNewExpense] = useState<Expense>({
    amount: 0,
    date: '',
    description: '',
    categoryId: null,
    budgetId: id || ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

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

  const handleAddExpense = async () => {
    if (newExpense.amount && newExpense.date.trim() && newExpense.description.trim()) {
      try {
        const response = await fetch(`http://localhost:8080/api/expense`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newExpense)
        });

        if (!response.ok) {
          throw new Error('Failed to add expense');
        }

        await fetchBudgetDetails();
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Expense added successfully',
          className: 'bg-green-500 text-white'
        });
      } catch (error) {
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
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  };

  if (!budget) {
    return <div>Loading...</div>;
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
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Input
                      type="number"
                      name="amount"
                      placeholder="Enter expense amount"
                      value={newExpense.amount}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Input
                      type="date"
                      name="date"
                      value={newExpense.date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Input
                      type="text"
                      name="description"
                      placeholder="Enter expense description"
                      value={newExpense.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Input
                      type="text"
                      name="categoryId"
                      placeholder="Enter category ID (optional)"
                      value={newExpense.categoryId || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <Button onClick={handleAddExpense} className="w-full">
                  Add Expense
                </Button>
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
