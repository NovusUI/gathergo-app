// components/feed/FeedRenderer.tsx
import React from "react";
import FeedCard, { FeedCardProps } from "./FeedCard";

const FeedRenderer: React.FC<FeedCardProps> = ({ feed, ...props }) => {
  // Single robust card renderer keeps feed style compact and consistent.
  return <FeedCard feed={feed} {...props} />;
};

export default FeedRenderer;
