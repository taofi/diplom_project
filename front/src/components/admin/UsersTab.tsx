'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/i18n/I18nContext';
import { getUsers, updateUserRoles, type UserResponse, type UserRole } from '@/lib/api-user';
import { Button, Spinner, ConfirmModal, CheckboxGroup, Pagination } from '@/components/ui';

export function UsersTab() {
  const { t, locale } = useI18n();
  
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ 
    total: 0, 
    page: 1, 
    limit: 20, 
    totalPages: 1 
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal state for roles editing
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const fetchUsers = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getUsers({
        page: pageNum,
        limit,
        search: debouncedSearch || undefined,
      });
      
      setUsers(result.data || []);
      setPagination({
        total: result.meta?.total || 0,
        page: result.meta?.page || 1,
        limit: result.meta?.limit || 20,
        totalPages: result.meta?.totalPages || 1,
      });
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Fetch users when search changes (initial load)
  useEffect(() => {
    fetchUsers(1);
  }, [debouncedSearch]);

  // Handle page change - вызывает fetch с новой страницей
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage);
  };

  // Open roles modal
  const handleOpenRolesModal = (user: UserResponse) => {
    setSelectedUser(user);
    setSelectedRoles(user.role || []);
    setRolesModalOpen(true);
  };

  // Close roles modal
  const handleCloseRolesModal = () => {
    setRolesModalOpen(false);
    setSelectedUser(null);
    setSelectedRoles([]);
  };

  // Update user roles
  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      await updateUserRoles(selectedUser.id, selectedRoles);
      handleCloseRolesModal();
      fetchUsers(pagination.page);
    } catch (err) {
      console.error('Failed to update user roles:', err);
      setError('Failed to update user roles');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get locale display
  const getLocaleDisplay = (userLocale: string) => {
    const localeMap: Record<string, string> = {
      'ru': '🇷🇺 RU',
      'en': '🇬🇧 EN',
    };
    return localeMap[userLocale] || userLocale.toUpperCase();
  };

  // Get role display
  const getRoleDisplay = (roles: UserRole[] | undefined) => {
    if (!Array.isArray(roles) || roles.length === 0) {
      return <span className="text-gray-400 text-sm">{t('admin.users.roles.none')}</span>;
    }

    const roleLabels: Record<UserRole, string> = {
      'admin': t('admin.users.roles.admin'),
      'author': t('admin.users.roles.author'),
      'user': t('admin.users.roles.user'),
    };
    
    return roles.map(role => (
      <span 
        key={role}
        className={`
          inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1
          ${role === 'admin' ? 'bg-red-100 text-red-800' : ''}
          ${role === 'author' ? 'bg-blue-100 text-blue-800' : ''}
          ${role === 'user' ? 'bg-gray-100 text-gray-800' : ''}
        `}
      >
        {roleLabels[role]}
      </span>
    ));
  };

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('admin.users.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('admin.users.noUsers')}
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.rolesTitle')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.locale')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.users.createdAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleDisplay(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getLocaleDisplay(user.locale)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRolesModal(user)}
                      >
                        {t('admin.users.changeRoles')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            className="mt-6"
          />
        </>
      )}

      {/* Roles Modal */}
      <ConfirmModal
        isOpen={rolesModalOpen}
        onClose={handleCloseRolesModal}
        onConfirm={handleUpdateRoles}
        title={t('admin.users.changeRoles')}
        message={
          <div>
            <p className="mb-4">
              {selectedUser?.name} ({selectedUser?.email})
            </p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('admin')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles([...selectedRoles, 'admin']);
                    } else {
                      setSelectedRoles(selectedRoles.filter(r => r !== 'admin'));
                    }
                  }}
                  className="mr-2"
                />
                <span>{t('admin.users.roles.admin')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('author')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles([...selectedRoles, 'author']);
                    } else {
                      setSelectedRoles(selectedRoles.filter(r => r !== 'author'));
                    }
                  }}
                  className="mr-2"
                />
                <span>{t('admin.users.roles.author')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('user')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles([...selectedRoles, 'user']);
                    } else {
                      setSelectedRoles(selectedRoles.filter(r => r !== 'user'));
                    }
                  }}
                  className="mr-2"
                />
                <span>{t('admin.users.roles.user')}</span>
              </label>
            </div>
          </div>
        }
        confirmText={t('common.save')}
        cancelText={t('common.cancel')}
        loading={isUpdating}
      />
    </div>
  );
}
