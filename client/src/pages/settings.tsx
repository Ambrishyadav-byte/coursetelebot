import React, { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { insertAdminUserSchema } from '@shared/schema';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Schema for telegram bot settings
const telegramSettingsSchema = z.object({
  botToken: z.string().min(1, { message: "Bot token is required" }),
});

// Schema for WooCommerce settings
const woocommerceSettingsSchema = z.object({
  apiUrl: z.string().url({ message: "Valid URL is required" }),
  consumerKey: z.string().min(1, { message: "Consumer key is required" }),
  consumerSecret: z.string().min(1, { message: "Consumer secret is required" }),
});

// Schema for security settings
const securitySettingsSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for recovery passphrase
const passphraseSettingsSchema = z.object({
  passphrase: z.string().min(6, { message: "Recovery passphrase must be at least 6 characters" }),
  confirmPassphrase: z.string().min(1, { message: "Please confirm your passphrase" }),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: "Passphrases don't match",
  path: ["confirmPassphrase"],
});

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isSavingWoocommerce, setIsSavingWoocommerce] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPassphrase, setIsSavingPassphrase] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  
  // Fetch admin users list
  const { data: adminUsers = [], isLoading: isLoadingAdminUsers } = useQuery({
    queryKey: ['/api/admins'],
    queryFn: getQueryFn<any[]>({ on401: 'throw' })
  });

  // Forms
  const adminUserForm = useForm({
    resolver: zodResolver(insertAdminUserSchema),
    defaultValues: {
      username: "",
      password: "",
      passphrase: "",
    },
  });

  const telegramForm = useForm<z.infer<typeof telegramSettingsSchema>>({
    resolver: zodResolver(telegramSettingsSchema),
    defaultValues: {
      botToken: "",
    },
  });

  const woocommerceForm = useForm<z.infer<typeof woocommerceSettingsSchema>>({
    resolver: zodResolver(woocommerceSettingsSchema),
    defaultValues: {
      apiUrl: "",
      consumerKey: "",
      consumerSecret: "",
    },
  });

  const securityForm = useForm<z.infer<typeof securitySettingsSchema>>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const passphraseForm = useForm<z.infer<typeof passphraseSettingsSchema>>({
    resolver: zodResolver(passphraseSettingsSchema),
    defaultValues: {
      passphrase: "",
      confirmPassphrase: "",
    },
  });

  // Fetch API configurations from the server
  const { data: apiConfigs = [], isLoading: isLoadingApiConfigs } = useQuery({
    queryKey: ['/api/api-configs'],
    queryFn: getQueryFn<any[]>({ on401: 'throw' })
  });

  // Load existing API settings from the server
  useEffect(() => {
    if (!isLoadingApiConfigs && apiConfigs.length > 0) {
      // Find Telegram config
      const telegramConfig = apiConfigs.find(config => config.name === 'telegram');
      if (telegramConfig) {
        // Use masked value for security (actual value only sent when updating)
        telegramForm.setValue('botToken', '•••••••••••••••••••••••••••••••');
      }

      // Find WooCommerce config
      const woocommerceConfig = apiConfigs.find(config => config.name === 'woocommerce');
      if (woocommerceConfig) {
        woocommerceForm.setValue('apiUrl', woocommerceConfig.url || 'https://lastbreakup.com/');
        // Use masked values for security (actual values only sent when updating)
        woocommerceForm.setValue('consumerKey', '•••••••••••••••••••••••••');
        woocommerceForm.setValue('consumerSecret', '•••••••••••••••••••••••••');
      }
    }
  }, [apiConfigs, isLoadingApiConfigs, telegramForm, woocommerceForm]);

  // Submit handlers for API configurations
  const onSaveTelegramSettings = (data: z.infer<typeof telegramSettingsSchema>) => {
    setIsSavingTelegram(true);
    
    // Call API to update Telegram bot token
    apiRequest("PUT", "/api/api-configs/telegram", {
      botToken: data.botToken,
    })
      .then((response: any) => {
        toast({
          title: "Settings Saved",
          description: response?.message || "Telegram bot settings have been updated.",
        });
        // Refresh API configs list
        queryClient.invalidateQueries({ queryKey: ['/api/api-configs'] });
      })
      .catch((error) => {
        toast({
          title: "Failed to update Telegram settings",
          description: error.message || "An error occurred while updating Telegram settings",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSavingTelegram(false);
      });
  };

  const onSaveWoocommerceSettings = (data: z.infer<typeof woocommerceSettingsSchema>) => {
    setIsSavingWoocommerce(true);
    
    // Call API to update WooCommerce credentials
    apiRequest("PUT", "/api/api-configs/woocommerce", {
      consumerKey: data.consumerKey,
      consumerSecret: data.consumerSecret,
      apiUrl: data.apiUrl,
    })
      .then((response: any) => {
        toast({
          title: "Settings Saved",
          description: response?.message || "WooCommerce API settings have been updated.",
        });
        // Refresh API configs list
        queryClient.invalidateQueries({ queryKey: ['/api/api-configs'] });
      })
      .catch((error) => {
        toast({
          title: "Failed to update WooCommerce settings",
          description: error.message || "An error occurred while updating WooCommerce settings",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSavingWoocommerce(false);
      });
  };

  const onSaveSecuritySettings = (data: z.infer<typeof securitySettingsSchema>) => {
    setIsSavingPassword(true);
    
    // Make API call to change password
    apiRequest("POST", "/api/change-password", {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
      .then(() => {
        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully.",
        });
        securityForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      })
      .catch((error) => {
        toast({
          title: "Failed to update password",
          description: error.message || "Please check your current password and try again",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSavingPassword(false);
      });
  };
  
  const onSavePassphraseSettings = (data: z.infer<typeof passphraseSettingsSchema>) => {
    setIsSavingPassphrase(true);
    
    // Make API call to update passphrase
    apiRequest("POST", "/api/update-passphrase", {
      passphrase: data.passphrase,
    })
      .then(() => {
        toast({
          title: "Recovery Passphrase Updated",
          description: "Your recovery passphrase has been set successfully. Keep it in a safe place.",
        });
        passphraseForm.reset({
          passphrase: "",
          confirmPassphrase: "",
        });
      })
      .catch((error) => {
        toast({
          title: "Failed to update passphrase",
          description: error.message || "An error occurred while setting your recovery passphrase",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSavingPassphrase(false);
      });
  };
  
  // Handle admin user creation
  const onCreateAdminUser = (data: any) => {
    setIsCreatingAdmin(true);
    
    // Make API call to create a new admin user
    apiRequest("POST", "/api/admins", {
      username: data.username,
      password: data.password,
      passphrase: data.passphrase
    })
      .then(() => {
        toast({
          title: "Admin User Created",
          description: `New admin user "${data.username}" has been created successfully.`,
        });
        adminUserForm.reset({
          username: "",
          password: "",
          passphrase: ""
        });
        
        // Refresh admin users list
        queryClient.invalidateQueries({ queryKey: ['/api/admins'] });
      })
      .catch((error) => {
        toast({
          title: "Failed to create admin user",
          description: error.message || "An error occurred while creating the admin user",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsCreatingAdmin(false);
      });
  };

  return (
    <Layout>
      <div className="pb-5">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your bot configuration, API integrations, and account security.
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="telegram">Telegram Bot</TabsTrigger>
          <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and manage your account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Username</p>
                <p className="text-sm text-muted-foreground">{user?.username || 'Admin'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Access Level</p>
                <Badge>Administrator</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-sm text-muted-foreground">Just now</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Bot Settings */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Bot Configuration</CardTitle>
              <CardDescription>
                Configure your Telegram bot settings. The bot token is used to authenticate with the Telegram API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...telegramForm}>
                <form onSubmit={telegramForm.handleSubmit(onSaveTelegramSettings)} className="space-y-4">
                  <FormField
                    control={telegramForm.control}
                    name="botToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bot Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Your Telegram bot token" {...field} />
                        </FormControl>
                        <FormDescription>
                          You can get this token from the BotFather on Telegram.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSavingTelegram}>
                    {isSavingTelegram ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WooCommerce Settings */}
        <TabsContent value="woocommerce">
          <Card>
            <CardHeader>
              <CardTitle>WooCommerce Integration</CardTitle>
              <CardDescription>
                Connect to your WooCommerce store to verify orders and user purchases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...woocommerceForm}>
                <form onSubmit={woocommerceForm.handleSubmit(onSaveWoocommerceSettings)} className="space-y-4">
                  <FormField
                    control={woocommerceForm.control}
                    name="apiUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-store.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={woocommerceForm.control}
                    name="consumerKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumer Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Your WooCommerce consumer key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={woocommerceForm.control}
                    name="consumerSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumer Secret</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Your WooCommerce consumer secret" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSavingWoocommerce}>
                    {isSavingWoocommerce ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Password Change Card */}
            <Card>
              <CardHeader>
                <CardTitle>Password Settings</CardTitle>
                <CardDescription>
                  Update your account password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSaveSecuritySettings)} className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Your current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Separator className="my-4" />
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Your new password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters long.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSavingPassword}>
                      {isSavingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Recovery Passphrase Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recovery Passphrase</CardTitle>
                <CardDescription>
                  Set a recovery passphrase to reset your password if you forget it. Keep this passphrase in a secure place.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passphraseForm}>
                  <form onSubmit={passphraseForm.handleSubmit(onSavePassphraseSettings)} className="space-y-4">
                    <FormField
                      control={passphraseForm.control}
                      name="passphrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recovery Passphrase</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter a memorable passphrase" {...field} />
                          </FormControl>
                          <FormDescription>
                            Choose a memorable but secure passphrase that's at least 6 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passphraseForm.control}
                      name="confirmPassphrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Passphrase</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your passphrase" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSavingPassphrase}>
                      {isSavingPassphrase ? "Setting..." : "Set Recovery Passphrase"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Admin Users Management */}
        <TabsContent value="admins">
          <div className="space-y-6">
            {/* Admin Users List */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>
                  List of administrator accounts in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAdminUsers ? (
                  <div className="text-center py-4">Loading admin users...</div>
                ) : adminUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No admin users found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Recovery Passphrase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">{admin.username}</TableCell>
                          <TableCell>{new Date(admin.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{admin.lastActivity ? new Date(admin.lastActivity).toLocaleString() : 'Never'}</TableCell>
                          <TableCell>
                            {admin.hasPassphrase ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Set</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Not Set</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
            {/* Add Admin User Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Admin User</CardTitle>
                <CardDescription>
                  Create additional administrator accounts for system management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...adminUserForm}>
                  <form onSubmit={adminUserForm.handleSubmit(onCreateAdminUser)} className="space-y-4">
                    <FormField
                      control={adminUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters long.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminUserForm.control}
                      name="passphrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recovery Passphrase</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Recovery passphrase for password reset" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional. Provide a recovery passphrase for password reset purposes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isCreatingAdmin}>
                      {isCreatingAdmin ? "Creating..." : "Create Admin User"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Settings;
