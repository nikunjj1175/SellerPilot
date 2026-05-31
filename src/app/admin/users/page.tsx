import { connectDB } from "@/lib/mongodb";
import { User, type IUser } from "@/models/User";
import { Report } from "@/models/Report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserActions } from "@/components/admin/user-actions";

export default async function AdminUsersPage() {
  await connectDB();

  const users = await User.find().sort({ createdAt: -1 }).limit(100).lean<IUser[]>();
  const reportCounts = await Report.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    reportCounts.map((r) => [r._id.toString(), r.count as number])
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4">User</th>
                <th className="pb-2 pr-4">Credits</th>
                <th className="pb-2 pr-4">Reports</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id.toString()} className="border-b border-border/50">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    <p className="text-xs">{u.role}</p>
                  </td>
                  <td className="py-3 pr-4">{u.credits}</td>
                  <td className="py-3 pr-4">{countMap[u._id.toString()] ?? 0}</td>
                  <td className="py-3 pr-4">
                    {u.suspended ? (
                      <span className="text-red-500">Suspended</span>
                    ) : (
                      <span className="text-emerald-600">Active</span>
                    )}
                  </td>
                  <td className="py-3">
                    <UserActions
                      userId={u._id.toString()}
                      suspended={u.suspended}
                      role={u.role}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
