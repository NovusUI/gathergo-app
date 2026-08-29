import ImpactPageLoader from "@/components/ui/ImpactPageLoader";

interface FullScreenLoaderProps {
  title?: string;
  message?: string;
}

export default function FullScreenLoader({
  title = "Mapping GatherGo",
  message = "Gathering the people, place, and purpose.",
}: FullScreenLoaderProps) {
  return <ImpactPageLoader title={title} message={message} />;
}
