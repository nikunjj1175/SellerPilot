import { connectDB } from "@/lib/mongodb";
import { User, type IUser } from "@/models/User";
import { Report } from "@/models/Report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserActions } from "@/components/admin/user-actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminUsersPage() {
  await connectDB();

  const users = await User.find({ role: { $ne: "ADMIN" } })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<IUser[]>();
  const reportCounts = await Report.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    reportCounts.map((r) => [r._id.toString(), r.count as number])
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description={`Manage seller accounts — ${users.length} users`}
      />

      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold">All users</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Credits</th>
                <th className="p-4 font-medium">Reports</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id.toString()} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-4">
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="p-4 font-semibold tabular-nums">{u.credits}</td>
                  <td className="p-4 tabular-nums">{countMap[u._id.toString()] ?? 0}</td>
                  <td className="p-4">
                    {u.suspended ? (
                      <span className="rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5 font-medium">
                        Suspended
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 font-medium">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-4">
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
