import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LogOut, User as UserIcon } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-slate-500">Lofix Platform Management</h2>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs border border-emerald-200">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[10px] text-slate-500">{user.email}</p>
            </div>
            <Badge variant="success" size="sm">
              {user.role}
            </Badge>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          leftIcon={<LogOut className="w-4 h-4 text-slate-500" />}
        >
          Logout
        </Button>
      </div>
    </header>
  );
};
