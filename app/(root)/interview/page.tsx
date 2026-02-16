import Agent from "@/components/Agent";
import LoginAlert from "@/components/LoginAlert";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <h3>Interview generation</h3>
        <LoginAlert />
      </>
    );
  }

  return (
    <>
      <h3>Interview generation</h3>
      <Agent
        userName={user?.name!}
        userId={user?.id}
        profileImage={user?.imageUrl}
        type="generate"
      />
    </>
  );
};

export default Page;
