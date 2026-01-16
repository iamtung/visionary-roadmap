import { Task } from "../types";
import { generateTasksCSV } from "../utils/csvUtils";
// @ts-ignore
import html2canvas from "html2canvas";

export const useExport = (tasks: Task[], isDarkMode: boolean) => {
  const exportToPNG = async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const originalPaddingBottom = element.style.paddingBottom;
    const originalHeight = element.style.height;
    const originalOverflow = element.style.overflow;

    element.style.paddingBottom = "50px";
    element.style.height = "auto";
    element.style.overflow = "visible";

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight + 50,
        windowWidth: element.scrollWidth,
        scrollY: -window.scrollY,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `roadmap-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Could not export image.");
    } finally {
      element.style.paddingBottom = originalPaddingBottom;
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;
    }
  };

  const exportToCSV = () => {
    const csvContent = generateTasksCSV(tasks);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `roadmap-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return {
    exportToPNG,
    exportToCSV,
  };
};
