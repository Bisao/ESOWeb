import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { useMMOGame } from '@/lib/stores/useMMOGame';

// Esquema de validação para login
const loginSchema = z.object({
  username: z.string().min(3, {
    message: 'Nome de usuário deve ter pelo menos 3 caracteres',
  }),
  password: z.string().min(4, {
    message: 'Senha deve ter pelo menos 4 caracteres',
  }),
});

// Esquema de validação para registro
const registerSchema = z.object({
  username: z.string().min(3, {
    message: 'Nome de usuário deve ter pelo menos 3 caracteres',
  }),
  password: z.string().min(4, {
    message: 'Senha deve ter pelo menos 4 caracteres',
  }),
  confirmPassword: z.string().min(4, {
    message: 'Confirme sua senha',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setLoggedIn, setPlayerId } = useMMOGame();

  // Formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Formulário de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Função para lidar com o login
  async function onLoginSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Falha ao fazer login');
      }
      
      // Login bem-sucedido
      setLoggedIn(true);
      setPlayerId(result.userId);
      
      // Redirecionar para a página do jogo
      navigate('/game');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  }

  // Função para lidar com o registro
  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Falha ao registrar');
      }
      
      // Registro bem-sucedido
      setSuccess('Conta criada com sucesso! Agora você pode fazer login.');
      registerForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao registrar');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-[350px] mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">ESO Web</CardTitle>
        <CardDescription className="text-center">
          Entre no mundo do MMO RPG online
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registrar</TabsTrigger>
          </TabsList>
          
          {/* Formulário de Login */}
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome de usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="text-sm font-medium text-red-500 dark:text-red-400">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Formulário de Registro */}
          <TabsContent value="register">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Escolha um nome de usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Escolha uma senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirme sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <div className="text-sm font-medium text-red-500 dark:text-red-400">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm font-medium text-green-500 dark:text-green-400">
                    {success}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registrando...' : 'Registrar'}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          © 2025 ESO Web MMO RPG
        </p>
      </CardFooter>
    </Card>
  );
}
