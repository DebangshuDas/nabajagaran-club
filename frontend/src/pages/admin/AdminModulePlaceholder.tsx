import { EmptyState } from "../../components/ui/EmptyState";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";

type AdminModulePlaceholderProps = {
  title: string;
};

export function AdminModulePlaceholder({ title }: AdminModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description="This module is not implemented yet. No records can be viewed or changed here."
      />
      <EmptyState message={`${title} management will be available in a later release.`} />
    </div>
  );
}
