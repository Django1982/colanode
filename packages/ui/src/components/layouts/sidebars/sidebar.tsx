import { SidebarMenuType } from '@colanode/client/types';
import { SidebarChats } from '@colanode/ui/components/layouts/sidebars/sidebar-chats';
import { SidebarMenu } from '@colanode/ui/components/layouts/sidebars/sidebar-menu';
import { SidebarSettings } from '@colanode/ui/components/layouts/sidebars/sidebar-settings';
import { SidebarSpaces } from '@colanode/ui/components/layouts/sidebars/sidebar-spaces';
import { useAccount } from '@colanode/ui/contexts/account';

interface SidebarProps {
  menu: SidebarMenuType;
  onMenuChange: (menu: SidebarMenuType) => void;
}

export const Sidebar = ({ menu, onMenuChange }: SidebarProps) => {
  const account = useAccount();

  return (
    <div className="flex h-screen min-h-screen max-h-screen w-full min-w-full flex-row bg-sidebar">
      <SidebarMenu value={menu} onChange={onMenuChange} />
      <div className="min-h-0 flex-grow overflow-auto border-l border-sidebar-border">
        {menu === 'spaces' && <SidebarSpaces />}
        {menu === 'chats' && <SidebarChats />}
        {menu === 'settings' && <SidebarSettings />}
      </div>
    </div>
  );
};
