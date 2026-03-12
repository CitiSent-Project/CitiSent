import { forwardRef } from "react";
import { RefreshControl, ScrollView } from "react-native";

const RefreshableScrollView = forwardRef(function RefreshableScrollView(
  { refreshing, onRefresh, children, ...props },
  ref
) {
  return (
    <ScrollView
      ref={ref}
      {...props}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {children}
    </ScrollView>
  );
});

export default RefreshableScrollView;
