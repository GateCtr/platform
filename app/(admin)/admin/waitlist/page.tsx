'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, CheckCircle, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  useCase: string | null;
  position: number;
  status: 'WAITING' | 'INVITED' | 'JOINED';
  createdAt: string;
}

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'WAITING' | 'INVITED' | 'JOINED'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/waitlist?${params}`);
      const data = await response.json();

      setEntries(data.entries);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch waitlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const getStatusBadge = (status: string) => {
    const variants = {
      WAITING: 'outline' as const,
      INVITED: 'secondary' as const,
      JOINED: 'default' as const,
    };

    const icons = {
      WAITING: <Clock className="w-3 h-3 mr-1" />,
      INVITED: <Mail className="w-3 h-3 mr-1" />,
      JOINED: <CheckCircle className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="flex items-center w-fit">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const stats = [
    {
      title: 'Total Entries',
      value: total,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Waiting',
      value: entries.filter(e => e.status === 'WAITING').length,
      icon: Clock,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Invited',
      value: entries.filter(e => e.status === 'INVITED').length,
      icon: Mail,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Joined',
      value: entries.filter(e => e.status === 'JOINED').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Waitlist Management
          </h1>
          <p className="text-muted-foreground">
            Manage and invite users from the waitlist
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Table Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Waitlist Entries</CardTitle>
                <CardDescription>
                  View and manage all waitlist submissions
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={filter}
                  onValueChange={(value) => setFilter(value as typeof filter)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entries</SelectItem>
                    <SelectItem value="WAITING">Waiting</SelectItem>
                    <SelectItem value="INVITED">Invited</SelectItem>
                    <SelectItem value="JOINED">Joined</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full sm:w-auto">
                  <Mail className="w-4 h-4 mr-2" />
                  Invite Batch
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Use Case
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No entries found
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="font-mono">
                            #{entry.position}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {entry.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                          {entry.name || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                          {entry.company || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                          {entry.useCase || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(entry.status)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground hidden sm:table-cell">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {entry.status === 'WAITING' && (
                            <Button variant="ghost" size="sm">
                              Invite
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && entries.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing page {page} of entries
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={entries.length < 50}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
