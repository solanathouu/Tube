-- Script de diagnostic simple pour trouver le problème

-- 1. LISTE DE TOUS LES UTILISATEURS
SELECT 
  email, 
  username, 
  phone_number,
  id
FROM public.users
ORDER BY email;

