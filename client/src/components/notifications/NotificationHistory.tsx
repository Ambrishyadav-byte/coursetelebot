import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { History, MessagesSquare, Users } from "lucide-react";

type Notification = {
  id: number;
  title: string;
  message: string;
  recipientType: string;
  recipientIds: string;
  sentBy: number;
  sentAt: string;
  status: string;
};

export function NotificationHistory() {
  const { data, isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });
  
  const notifications = data || [];

  const getRecipientCount = (notification: Notification) => {
    if (notification.recipientType === "all") {
      return "All Users";
    }
    try {
      const recipients = JSON.parse(notification.recipientIds);
      return `${recipients.length} Users`;
    } catch (e) {
      return "Unknown";
    }
  };

  if (isLoading) {
    return <NotificationHistorySkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5" />
            Notification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-destructive">
            Error loading notifications: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <History className="h-5 w-5" />
          Notification History
        </CardTitle>
        <CardDescription>
          Recent notifications sent to users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!notifications || notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No notifications have been sent yet
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map(notification => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[200px]">{notification.title}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {notification.message.substring(0, 50)}
                                {notification.message.length > 50 ? "..." : ""}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-[300px]">
                              <div className="font-bold mb-1">{notification.title}</div>
                              <div>{notification.message}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {notification.recipientType === "all" ? (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <MessagesSquare className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{getRecipientCount(notification)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(notification.sentAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={notification.status === "sent" ? "outline" : "secondary"}
                        className={notification.status === "sent" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }
                      >
                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <History className="h-5 w-5" />
          Notification History
        </CardTitle>
        <CardDescription>
          Recent notifications sent to users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Skeleton className="h-4 w-[180px]" />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}