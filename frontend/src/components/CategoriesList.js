// frontend/src/components/CategoriesList.js
import React, { useEffect, useState } from "react";
import { getCategories } from "../services/api";

function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then(data => {
      setCategories(data || []);
      setLoading(false);
    }).catch(err => console.error(err));
  }, []);

  if (loading) return <p>Loading categories...</p>;

  return (
    <section>
      <h2>Categories ({categories.length})</h2>
      <ul>
        {categories.map(c => <li key={c.id}>{c.name}</li>)}
      </ul>
    </section>
  );
}

export default CategoriesList;