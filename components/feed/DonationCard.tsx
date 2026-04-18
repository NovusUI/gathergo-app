import React from "react";
import FeedCard, { FeedCardProps } from "./FeedCard";

const DonationCard: React.FC<FeedCardProps> = ({ feed, ...props }) => {
  return <FeedCard feed={feed} {...props} />;
};

export default DonationCard;
