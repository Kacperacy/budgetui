import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import formatDate from '@/util/formatDate.ts';
import { Budget } from '@/types/Budget';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';

const Dashboard = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: '',
    startDate: '',
    endDate: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
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
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load budgets. Please try again later.'
        });
      }
    };

    fetchBudgets();
  }, [token, toast]);

  const handleAddBudget = async () => {
    if (
      newBudget.name.trim() &&
      newBudget.amount.trim() &&
      newBudget.startDate &&
      newBudget.endDate
    ) {
      try {
        const response = await fetch('http://localhost:8080/api/budget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newBudget)
        });

        if (!response.ok) {
          throw new Error('Failed to create budget');
        }

        const data = await response.json();
        setBudgets([...budgets, data]);
        setNewBudget({ name: '', amount: '', startDate: '', endDate: '' });
        setIsDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Budget created successfully',
          className: 'bg-green-500 text-white'
        });
      } catch (error) {
        console.error('Error creating budget:', error);
        toast({
          variant: 'destructive',
          title: 'Error Creating Budget',
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
    setNewBudget({ ...newBudget, [e.target.name]: e.target.value });
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
          {budgets.map((budget, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{budget.name}</CardTitle>
                <CardDescription>
                  {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Budget</span>
                  <span className="text-2xl font-bold">{budget.amount} zł</span>
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-lg transition-shadow border-dashed cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center h-[200px] space-y-4">
                  <div className="p-4 rounded-full bg-secondary">
                    <span className="text-4xl">+</span>
                  </div>
                  <CardDescription>Create New Budget</CardDescription>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input
                    type="text"
                    name="name"
                    placeholder="Enter budget name"
                    value={newBudget.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Input
                    type="number"
                    name="amount"
                    placeholder="Enter budget amount"
                    value={newBudget.amount}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Input
                    type="date"
                    name="startDate"
                    value={newBudget.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Input
                    type="date"
                    name="endDate"
                    value={newBudget.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <Button onClick={handleAddBudget} className="w-full">
                Create Budget
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {budgets.length === 0 && (
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle>No Budgets Yet</CardTitle>
              <CardDescription>
                Create your first budget to start managing your finances
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
};

export default Dashboard;
