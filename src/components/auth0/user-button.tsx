import { LogOut, User } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KeyValueMap {
  [key: string]: any;
}

function getAvatarFallback(user: KeyValueMap) {
  const givenName = user.given_name;
  const familyName = user.family_name;
  const nickname = user.nickname;
  const name = user.name;

  if (givenName && familyName) {
    return `${givenName[0]}${familyName[0]}`;
  }

  if (nickname) {
    return nickname[0];
  }

  return name[0];
}

export default function UserButton({
  user,
  children,
  logoutUrl = '/api/auth/logout',
}: {
  user: KeyValueMap;
  children?: React.ReactNode;
  logoutUrl?: string;
}) {
  const picture = user.picture;
  const name = user.name;
  const email = user.email;
  const resolvedLogoutUrl = logoutUrl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={picture} alt={picture} />
            <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={picture} alt={picture} />
              <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{name}</p>
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        {children && (
          <>
            <DropdownMenuSeparator />
            {children}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem>
          <a href={resolvedLogoutUrl} className="flex gap-2 items-center">
            <LogOut />
            Log out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
