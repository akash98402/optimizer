
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Task } from "../types";

// Note: Using type casting for the autoTable plugin to avoid environment-specific issues with module augmentation of 'jspdf'
export const exportTasksToPDF = (tasks: Task[]) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Academic Workflow - Task Report", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  const tableColumn = ["Title", "Category", "Deadline", "Effort", "Weight", "Priority", "Status"];
  const tableRows = tasks.map(task => [
    task.title,
    task.category,
    new Date(task.deadline).toLocaleDateString(),
    `${task.effortHours}h`,
    `${(task.academicWeight * 100).toFixed(0)}%`,
    task.priorityScore.toFixed(2),
    task.status.toUpperCase()
  ]);

  // Use type casting to avoid "Property 'autoTable' does not exist on type 'jsPDF'" error
  // while also bypassing the "module 'jspdf' cannot be found" augmentation error previously encountered.
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 247, 251] }
  });

  doc.save(`academic-tasks-${new Date().getTime()}.pdf`);
};
