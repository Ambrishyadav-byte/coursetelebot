import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SelectUsers } from "../components/notifications/SelectUsers";
import { NotificationHistory } from "../components/notifications/NotificationHistory";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bell, Send, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all"); // "all" or "selected"
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const { data, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  const users = data || [];

  const sendNotification = useMutation({
    mutationFn: async () => {
      const recipients = recipientType === "all" ? "all" : selectedUsers;
      const response = await apiRequest(
        "POST",
        "/api/notifications",
        { title, message, recipients }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notification sent",
        description: recipientType === "all"
          ? "Your notification has been sent to all users"
          : `Your notification has been sent to ${selectedUsers.length} ${selectedUsers.length === 1 ? "user" : "users"}`,
      });
      setTitle("");
      setMessage("");
      setRecipientType("all");
      setSelectedUsers([]);
      setActiveTab("history");
    },
    onError: (error) => {
      toast({
        title: "Failed to send notification",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const isFormValid = title.trim() !== "" && message.trim() !== "" && 
    (recipientType === "all" || selectedUsers.length > 0);

  const handleSendNotification = () => {
    if (!isFormValid) {
      toast({
        title: "Cannot send notification",
        description: "Please provide a title, message and select at least one recipient",
        variant: "destructive",
      });
      return;
    }
    
    sendNotification.mutate();
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
        <Bell className="h-7 w-7" />
        Notifications
      </h1>
      <p className="text-muted-foreground mb-6">
        Send and manage notifications to your application users
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="new">New Notification</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Send className="h-5 w-5" />
                Create Notification
              </CardTitle>
              <CardDescription>
                Send a notification to all users or selected individuals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Notification Title
                </label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Enter your notification message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Recipients</label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={recipientType === "all" ? "default" : "outline"}
                    className="flex items-center gap-2 w-full sm:w-auto"
                    onClick={() => setRecipientType("all")}
                  >
                    <Users className="h-4 w-4" />
                    <span>All Users</span>
                  </Button>
                  <Button
                    type="button"
                    variant={recipientType === "selected" ? "default" : "outline"}
                    className="flex items-center gap-2 w-full sm:w-auto"
                    onClick={() => setRecipientType("selected")}
                  >
                    <Users className="h-4 w-4" />
                    <span>Selected Users</span>
                  </Button>
                </div>
              </div>

              {recipientType === "selected" && (
                <div className="pt-2">
                  {isLoadingUsers ? (
                    <div className="space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-[300px] w-full" />
                    </div>
                  ) : (
                    <SelectUsers 
                      users={users || []}
                      selectedUsers={selectedUsers}
                      setSelectedUsers={setSelectedUsers}
                    />
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSendNotification}
                disabled={!isFormValid || sendNotification.isPending}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>
                  {sendNotification.isPending ? "Sending..." : "Send Notification"}
                </span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <NotificationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}