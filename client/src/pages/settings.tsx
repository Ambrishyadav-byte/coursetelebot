import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { apiRequest } from '@/lib/queryClient';

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

  // Forms
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

  // Load existing settings (in a real application, this would fetch from the server)
  useEffect(() => {
    // Here we'd typically fetch settings from the server
    // For now, we'll just assume environment variables are used
    
    const loadSettings = async () => {
      try {
        // In a real application, you would fetch these from your API
        telegramForm.setValue('botToken', '•••••••••••••••••••••••••••••••');
        woocommerceForm.setValue('apiUrl', 'https://your-store.com');
        woocommerceForm.setValue('consumerKey', '•••••••••••••••••••••••••');
        woocommerceForm.setValue('consumerSecret', '•••••••••••••••••••••••••');
      } catch (error) {
        console.error('Failed to load settings', error);
      }
    };

    loadSettings();
  }, [telegramForm, woocommerceForm]);

  // Submit handlers - these would typically save to your API
  const onSaveTelegramSettings = (data: z.infer<typeof telegramSettingsSchema>) => {
    setIsSavingTelegram(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSavingTelegram(false);
      toast({
        title: "Settings Saved",
        description: "Telegram bot settings have been updated.",
      });
    }, 1000);
  };

  const onSaveWoocommerceSettings = (data: z.infer<typeof woocommerceSettingsSchema>) => {
    setIsSavingWoocommerce(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSavingWoocommerce(false);
      toast({
        title: "Settings Saved",
        description: "WooCommerce API settings have been updated.",
      });
    }, 1000);
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
      </Tabs>
    </Layout>
  );
};

export default Settings;
