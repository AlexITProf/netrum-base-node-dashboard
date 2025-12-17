import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface NodeTaskStats {
  success: boolean;
  nodeId: string;
  taskCount: number;
  currentTaskType: string;
  ttsPowerStatus: string;
  availableRam: number;
  lastTaskAssigned: string | null;
  lastTaskCompleted: string | null;
  lastPolledAt: string;
  nodeStatus: string;
}

interface TaskActivityProps {
  stats: NodeTaskStats;
}

export function TaskActivity({ stats }: TaskActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Activity</CardTitle>
        <CardDescription>
          Operational node statistics (not rewards)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div>
          Total Tasks Completed: <b>{stats.taskCount.toLocaleString()}</b>
        </div>
        <div>
          Node Status: <b>{stats.nodeStatus}</b>
        </div>
        <div>
          Current Activity: <b>{stats.ttsPowerStatus}</b>
        </div>
        <div>
          Current Task Type: <b>{stats.currentTaskType}</b>
        </div>
        <div>
          Available RAM: <b>{stats.availableRam} GB</b>
        </div>

        <div>
          Last Task Assigned:{" "}
          <b>
            {stats.lastTaskAssigned
              ? new Date(stats.lastTaskAssigned).toLocaleString()
              : "—"}
          </b>
        </div>

        <div>
          Last Task Completed:{" "}
          <b>
            {stats.lastTaskCompleted
              ? new Date(stats.lastTaskCompleted).toLocaleString()
              : "—"}
          </b>
        </div>

        <div className="text-xs text-muted-foreground">
          Last polled at {new Date(stats.lastPolledAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

