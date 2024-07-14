import { Button } from "@/components/ui/button";
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import Input from "views/components/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loginUser, logoutUser, registerUser } from "utils/graphql";
import { apolloClient } from "views/timetable/TimetableContent";
import { AuthContext } from "./AuthContext";

export const Login = () => {
  const { user, setUser } = useContext(AuthContext)!;
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const user = await loginUser(apolloClient, username, password);
    console.log({ user });
    setUser(user);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await registerUser(apolloClient, username, password);
  };

  return (
    <div className="container">
      <h1 className="header text-center">Login/Register</h1>
      <Tabs
        defaultValue="login"
        className="w-full m-0 md:w-1/2 md:mx-auto mt-5"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="mt-5" variant="submit" type="submit">
              Login
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="register">
          <form onSubmit={handleRegister}>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
              }}
            />
            <Button className="mt-5" variant="submit" type="submit">
              Register
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};
