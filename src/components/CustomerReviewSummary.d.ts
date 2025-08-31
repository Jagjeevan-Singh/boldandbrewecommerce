import React from 'react';
export interface Review {
  id?: string;
  rating: number;
  review?: string;
  userName?: string;
}
export interface CustomerReviewSummaryProps {
  reviews: Review[];
  onWriteReview: () => void;
}
declare const CustomerReviewSummary: React.FC<CustomerReviewSummaryProps>;
export default CustomerReviewSummary;
