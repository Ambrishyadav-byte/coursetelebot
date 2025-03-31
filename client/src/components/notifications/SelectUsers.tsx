import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, UserCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  name?: string;
  email: string;
  telegramId?: string;
  isVerified?: boolean;
}

interface SelectUsersProps {
  users: User[];
  selectedUsers: number[];
  setSelectedUsers: (ids: number[]) => void;
}

export function SelectUsers({ users, selectedUsers, setSelectedUsers }: SelectUsersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.telegramId && user.telegramId.toLowerCase().includes(searchLower))
    );
  });

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleToggleUser = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const allFilteredSelected = filteredUsers.length > 0 && 
    filteredUsers.every(user => selectedUsers.includes(user.id));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users by email, name, or Telegram ID"
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearSelection}
          disabled={selectedUsers.length === 0}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex items-center space-x-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {selectedUsers.length} {selectedUsers.length === 1 ? "user" : "users"} selected
          </span>
        </div>
      )}

      <div className="border rounded-md">
        <div className="border-b px-4 py-3 flex items-center">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all" 
              checked={allFilteredSelected && filteredUsers.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="font-medium">
              {allFilteredSelected ? "Deselect All" : "Select All"}
            </Label>
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
          </span>
        </div>
        
        <ScrollArea className="h-[300px]">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map(user => (
                <div key={user.id} className="px-4 py-3 flex items-start space-x-3 hover:bg-accent/20">
                  <Checkbox 
                    id={`user-${user.id}`}
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleToggleUser(user.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={`user-${user.id}`} 
                      className="font-medium cursor-pointer flex items-center"
                    >
                      {user.name || user.email}
                      {user.isVerified ? (
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                          Unverified
                        </Badge>
                      )}
                    </Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      {user.email}
                      {user.telegramId && (
                        <div className="mt-0.5">Telegram: {user.telegramId}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}