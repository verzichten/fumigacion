-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-12-2025 a las 21:52:46
-- Versión del servidor: 11.8.3-MariaDB-log
-- Versión de PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `u994005923_Servilutionfum`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `municipios`
--

CREATE TABLE `municipios` (
  `id_municipio` int(11) NOT NULL,
  `id_departamento` int(11) NOT NULL,
  `Nombre` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `municipios`
--

INSERT INTO `municipios` (`id_municipio`, `id_departamento`, `Nombre`) VALUES
(125, 1, 'MEDELLIN'),
(126, 1, 'BELLO'),
(127, 1, 'ITAGUI'),
(128, 1, 'ENVIGADO'),
(129, 1, 'SABANETA'),
(130, 1, 'CALDAS'),
(131, 1, 'LA ESTRELLA'),
(132, 1, 'BARBOSA'),
(133, 1, 'GIRARDOTA'),
(134, 1, 'COPACABANA'),
(135, 1, 'SANTAFE DE ANTIOQUIA'),
(136, 1, 'SAN JERONIMO'),
(137, 1, 'AMAGA'),
(138, 1, 'SOPETRAN'),
(139, 1, 'MARINILLA'),
(140, 1, 'RIONEGRO/LLANO GRANDE'),
(141, 1, 'GUARNE'),
(142, 1, 'EL RETIRO'),
(143, 1, 'LA CEJA'),
(144, 1, 'ENTRERRIOS ANTIOQUIA'),
(145, 1, 'SANTA HELENA DE OPON'),
(146, 1, 'BURITICA'),
(147, 1, 'AMALFI'),
(148, 1, 'EL CARMEN DE VIBORAL'),
(149, 1, 'GUATAPE'),
(150, 1, 'SANTO DOMINGO'),
(151, 1, 'San vicente - Ferrer'),
(152, 1, 'SEGOVIA'),
(153, 1, 'LA PINTADA'),
(154, 1, 'SAN ROQUE'),
(155, 5, 'CHAT_BOT'),
(156, 1, 'El Peñol'),
(157, 1, 'San Rafael'),
(158, 1, 'SONSON'),
(159, 1, 'ARGELIA'),
(160, 1, 'ABEJORRAL'),
(161, 1, 'COCORNÁ'),
(162, 1, 'NARIÑO'),
(163, 1, 'SAN FRANCISCO');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `municipios`
--
ALTER TABLE `municipios`
  ADD PRIMARY KEY (`id_municipio`),
  ADD KEY `id_departamento` (`id_departamento`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `municipios`
--
ALTER TABLE `municipios`
  MODIFY `id_municipio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=164;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `municipios`
--
ALTER TABLE `municipios`
  ADD CONSTRAINT `municipios_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
