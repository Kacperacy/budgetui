import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Category } from '@/types/Category';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BudgetRole } from '@/types/BudgetUser';
import { Label } from '@/components/ui/label';
import { BudgetUser } from '@/types/BudgetUser';
import { Expense } from '@/types/Expense';

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().nullable()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

// Add category form schema
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

type CategoryFormData = z.infer<typeof categorySchema>;

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<BudgetRole>(BudgetRole.Viewer);
  const [budgetUsers, setBudgetUsers] = useState<BudgetUser[]>([]);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      categoryId: null
    }
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: ''
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!id || !token) return;

      try {
        setIsLoadingCategories(true);
        const response = await fetch(`http://localhost:8080/api/budgets/${id}/category`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load categories'
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [id, token]);

  const handleAddExpense = async (values: ExpenseFormData) => {
    try {
      const response = await fetch(`http://localhost:8080/api/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...values,
          budgetId: id,
          categoryId: values.categoryId === 'none' ? null : values.categoryId
        })
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

  const handleDeleteBudget = async () => {
    if (!id || !token) return;

    try {
      const response = await fetch(`http://localhost:8080/api/budget/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      toast({
        title: 'Success',
        description: 'Budget deleted successfully',
        className: 'bg-green-500 text-white'
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        variant: 'destructive',
        title: 'Error Deleting Budget',
        description: 'Failed to delete budget. Please try again.'
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle category creation
  const handleAddCategory = async (values: CategoryFormData) => {
    try {
      const response = await fetch(`http://localhost:8080/api/budgets/${id}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const newCategory = await response.json();
      setCategories([...categories, newCategory]);
      setIsAddCategoryDialogOpen(false);
      categoryForm.reset();

      toast({
        title: 'Success',
        description: 'Category created successfully',
        className: 'bg-green-500 text-white'
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create category'
      });
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/budgets/${id}/category/${categoryId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories(categories.filter((c) => c.id !== categoryId));
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
        className: 'bg-green-500 text-white'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete category'
      });
    }
  };

  // Handle user addition
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8080/api/budgets/${id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add user');
      }

      setIsAddUserDialogOpen(false);
      setNewUserEmail('');
      await fetchBudgetUsers();
      toast({
        title: 'Success',
        description: 'User added successfully',
        className: 'bg-green-500 text-white'
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add user'
      });
    }
  };

  // Handle user removal
  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/budgets/${id}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove user');
      }

      await fetchBudgetUsers();
      toast({
        title: 'Success',
        description: 'User removed successfully',
        className: 'bg-green-500 text-white'
      });
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove user'
      });
    }
  };

  // Dodaj funkcję handleDeleteExpense
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/expense/${expenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      await fetchBudgetDetails();
      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
        className: 'bg-green-500 text-white'
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete expense'
      });
    }
  };

  // Dodaj funkcję do pobierania użytkowników
  const fetchBudgetUsers = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/budgets/${id}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch budget users');
      }
      const data = await response.json();
      setBudgetUsers(data);
    } catch (error) {
      console.error('Error fetching budget users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users'
      });
    }
  };

  // Dodaj useEffect do pobierania użytkowników
  useEffect(() => {
    if (id) {
      fetchBudgetUsers();
    }
  }, [id, token]);

  // Dodaj funkcje sprawdzające uprawnienia
  const canManageUsers = (budget: Budget): boolean => {
    return budget.currentUserRole === BudgetRole.Owner;
  };

  const canManageCategories = (budget: Budget): boolean => {
    return (
      budget.currentUserRole === BudgetRole.Owner || budget.currentUserRole === BudgetRole.Manager
    );
  };

  const canAddExpenses = (budget: Budget): boolean => {
    return (
      budget.currentUserRole === BudgetRole.Owner || budget.currentUserRole === BudgetRole.Manager
    );
  };

  const canDeleteBudget = (budget: Budget): boolean => {
    return budget.currentUserRole === BudgetRole.Owner;
  };

  const canDeleteExpense = (budget: Budget): boolean => {
    return (
      budget.currentUserRole === BudgetRole.Owner || budget.currentUserRole === BudgetRole.Manager
    );
  };

  if (!budget) {
    return <LoadingState />;
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4 max-w-4xl pt-20 min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Budget Details</h1>
          <div className="space-x-2">
            {canManageUsers(budget) && (
              <Button
                variant="outline"
                onClick={() => setIsUsersDialogOpen(true)}
                className="text-foreground hover:text-foreground">
                Manage Users
              </Button>
            )}
            {canManageCategories(budget) && (
              <Button
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(true)}
                className="text-foreground hover:text-foreground">
                Manage Categories
              </Button>
            )}
            {canDeleteBudget(budget) && (
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                Delete Budget
              </Button>
            )}
          </div>
        </div>
        <Card className="mb-4">
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

        <Card className="flex-1 flex flex-col mb-4 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            {canAddExpenses(budget) && (
              <Button onClick={() => setIsDialogOpen(true)}>Add Expense</Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-40rem)]">
              {budget.expenses.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {budget.expenses.map((expense: Expense, index: number) => (
                    <Card key={index} className="bg-secondary">
                      <CardContent className="flex justify-between items-center p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{expense.description}</p>
                            <Badge
                              variant="outline"
                              className={
                                expense.category
                                  ? 'bg-primary/20 text-primary border-primary/50 font-medium'
                                  : 'bg-muted/50 text-muted-foreground'
                              }>
                              {expense.category ? expense.category.name : 'No category'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(expense.date)}
                            </p>
                            <span className="text-sm text-muted-foreground">•</span>
                            <p className="text-sm text-muted-foreground">
                              Added by {expense.user.username || expense.user.email.split('@')[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-lg">
                            {expense.amount} zł
                          </Badge>
                          {canDeleteExpense(budget) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteExpense(expense.id)}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </Button>
                          )}
                        </div>
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

        <div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="text-foreground hover:text-foreground">
            Back
          </Button>
        </div>

        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
              <DialogDescription>Create and manage your budget categories</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {canManageCategories(budget) && (
                <div className="flex justify-end">
                  <Button onClick={() => setIsAddCategoryDialogOpen(true)}>Add New Category</Button>
                </div>
              )}

              <ScrollArea className="h-[400px] pr-4">
                {isLoadingCategories ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : categories.length > 0 ? (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                        {canManageCategories(budget) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No categories available</p>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>Add a new category for your expenses.</DialogDescription>
            </DialogHeader>
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(handleAddCategory)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Create Category
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog modal={true} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-background">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Add a new expense to your budget.</DialogDescription>
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
                        <Input placeholder="Enter description" {...field} />
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
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                        value={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your budget and all its
                expenses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBudget}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Manage Users</DialogTitle>
              <DialogDescription>Manage users who have access to this budget</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsAddUserDialogOpen(true)}>Add New User</Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {budgetUsers?.length > 0 ? (
                    budgetUsers.map((budgetUser) => (
                      <div
                        key={budgetUser.id}
                        className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {budgetUser.user.username || budgetUser.user.email}
                          </p>
                          <Badge variant="secondary">{BudgetRole[budgetUser.role]}</Badge>
                        </div>
                        {budgetUser.role !== BudgetRole.Owner && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveUser(budgetUser.user.id)}>
                            Remove
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No users available</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Add a new user to this budget</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value) => setNewUserRole(Number(value))}
                  defaultValue={String(BudgetRole.Viewer)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(BudgetRole.Manager)}>Manager</SelectItem>
                    <SelectItem value={String(BudgetRole.Viewer)}>Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Add User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Details;
