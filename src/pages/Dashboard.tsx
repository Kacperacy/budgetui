import { useEffect, useState } from 'react';
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

const Dashboard = () => {
  const [budgets, setBudgets] = useState<string[]>([]);
  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: '',
    startDate: '',
    endDate: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { token, logout } = useAuth();

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/budget', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setBudgets(data);
      } catch (error) {
        console.error('Error fetching budgets:', error);
      }
    };

    fetchBudgets();
  }, [token]);

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
        const data = await response.json();
        setBudgets([...budgets, data.name]);
        setNewBudget({ name: '', amount: '', startDate: '', endDate: '' });
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error adding budget:', error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewBudget({ ...newBudget, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-4 text-center">
      <Button className="absolute top-0 right-0 m-4" variant="secondary" onClick={logout}>
        Logout
      </Button>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <h2 className="text-xl font-semibold mb-2">Your Budgets</h2>
      <ul className="list-disc mb-6">
        {budgets.map((budget, index) => (
          <li key={index} className="flex flex-col justify-between items-center mb-2">
            <span>{budget}</span>
            <Button>View Details</Button>
          </li>
        ))}
      </ul>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Create New Budget</Button>
        </DialogTrigger>
        <DialogContent className="p-4">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-4">
            <Input
              type="text"
              name="name"
              placeholder="Enter budget name"
              value={newBudget.name}
              onChange={handleChange}
            />
            <Input
              type="number"
              name="amount"
              placeholder="Enter budget amount"
              value={newBudget.amount}
              onChange={handleChange}
            />
            <Input
              type="date"
              name="startDate"
              placeholder="Enter start date"
              value={newBudget.startDate}
              onChange={handleChange}
            />
            <Input
              type="date"
              name="endDate"
              placeholder="Enter end date"
              value={newBudget.endDate}
              onChange={handleChange}
            />
            <Button onClick={handleAddBudget}>Add Budget</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
