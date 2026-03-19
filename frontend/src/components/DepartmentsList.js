// frontend/src/components/DepartmentsList.js
import React, { useEffect, useState } from "react";
import { getDepartments } from "../services/api";

function DepartmentsList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Prevents memory leaks

    getDepartments()
      .then(data => {
        if (isMounted) {
          setDepartments(data || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError("Failed to load departments");
          setLoading(false);
          console.error(err);
        }
      });

    return () => { isMounted = false; };
  }, []); // Only one useEffect needed!

  if (loading) return <p className="animate-pulse">Loading departments...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  
  return (
    <section className="p-4 border rounded shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-2">Departments ({departments.length})</h2>
      <ul className="list-disc pl-5">
        {departments.map(d => (
          <li key={d.id} className="text-gray-700">{d.name}</li>
        ))}
      </ul>
    </section>
  );
}

export default DepartmentsList;