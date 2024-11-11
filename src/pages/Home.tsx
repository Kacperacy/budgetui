import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Login from '@/components/Login';
import Register from '@/components/Register';

function Home() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center justify-center text-primary-foreground mt-[10%]">
        <h1 className="font-extrabold text-4xl">Budget app</h1>
        <h3 className="text-2xl">Manage your budget</h3>
      </div>
      <Tabs defaultValue="login" className="w-[400px] mt-[10%]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Login />
        </TabsContent>
        <TabsContent value="register">
          <Register />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Home;
