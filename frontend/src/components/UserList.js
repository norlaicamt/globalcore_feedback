// frontend/src/components/UserList.js
import React, { useEffect, useState } from "react";
import { getUsers } from "../services/api";

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(data => {
      setUsers(data || []);
      setLoading(false);
    }).catch(err => console.error(err));
  }, []);

  if (loading) return <p>Loading users...</p>;

  return (
    <section>
      <h2>Users ({users.length})</h2>
      <ul>
        {users.map(u => <li key={u.id}>{u.name} ({u.email})</li>)}
      </ul>
    </section>
  );
}

export default UserList;