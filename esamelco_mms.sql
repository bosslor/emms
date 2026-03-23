-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 05, 2026 at 07:09 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `esamelco_mms`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `log_id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` enum('LOGIN','LOGOUT','CREATE','UPDATE','APPROVE','REJECT','DELETE','ASSIGN','VIEW','EXPORT') NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `details` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_log`
--

INSERT INTO `audit_log` (`log_id`, `user_id`, `action`, `module`, `ref_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 01:28:06'),
(2, 1, 'CREATE', 'workers', 6, 'Added worker: JP Marin (W006) — Crew Bravo', '::1', NULL, '2026-02-24 01:29:06'),
(3, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 01:29:16'),
(4, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 01:29:34'),
(5, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-24 01:29:43'),
(6, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 01:29:50'),
(7, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 01:30:36'),
(8, 11, 'LOGIN', NULL, NULL, 'User Casis, Monica C. logged in as Member / Consumer', '::1', NULL, '2026-02-24 01:30:53'),
(9, 11, 'CREATE', 'service_requests', 1, 'Created SR-2026-0001 — No Light', '::1', NULL, '2026-02-24 01:31:25'),
(10, 11, 'LOGOUT', NULL, NULL, 'User Casis, Monica C. logged out', '::1', NULL, '2026-02-24 01:31:28'),
(11, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 01:31:36'),
(12, 1, 'UPDATE', 'service_requests', NULL, 'SR-2026-0001 → In Progress', '::1', NULL, '2026-02-24 01:31:44'),
(13, 1, 'ASSIGN', NULL, NULL, 'Assigned W006 on SR-2026-0001', '::1', NULL, '2026-02-24 01:31:55'),
(14, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 01:31:58'),
(15, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 01:32:06'),
(16, 14, 'UPDATE', 'service_requests', NULL, 'SR-2026-0001 → Completed', '::1', NULL, '2026-02-24 01:35:27'),
(17, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-24 01:35:35'),
(18, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 01:39:14'),
(19, 1, 'CREATE', 'members', 6, 'Registered member: Marin, JP (05-0193-0441)', '::1', NULL, '2026-02-24 01:59:20'),
(20, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 01:59:36'),
(21, 4, 'LOGIN', NULL, NULL, 'User Engr. Greg A. Lim It logged in as CAO Area Manager', '::1', NULL, '2026-02-24 01:59:52'),
(22, 4, 'LOGOUT', NULL, NULL, 'User Engr. Greg A. Lim It logged out', '::1', NULL, '2026-02-24 02:00:25'),
(23, 11, 'LOGIN', NULL, NULL, 'User Casis, Monica C. logged in as Member / Consumer', '::1', NULL, '2026-02-24 02:00:47'),
(24, 11, 'CREATE', 'service_requests', 2, 'Created SR-2026-0002 — New Connection', '::1', NULL, '2026-02-24 02:01:05'),
(25, 11, 'CREATE', 'senior_citizen_discounts', 1, 'Created SC-2026-0001', '::1', NULL, '2026-02-24 02:02:27'),
(26, 11, 'LOGOUT', NULL, NULL, 'User Casis, Monica C. logged out', '::1', NULL, '2026-02-24 02:02:39'),
(27, 4, 'LOGIN', NULL, NULL, 'User Engr. Greg A. Lim It logged in as CAO Area Manager', '::1', NULL, '2026-02-24 02:02:52'),
(28, 4, 'APPROVE', 'senior_citizen_discounts', NULL, 'Approved SC-2026-0001', '::1', NULL, '2026-02-24 02:03:07'),
(29, 4, 'LOGOUT', NULL, NULL, 'User Engr. Greg A. Lim It logged out', '::1', NULL, '2026-02-24 02:03:18'),
(30, 12, 'LOGIN', NULL, NULL, 'User Santos, Juan D. logged in as Member / Consumer', '::1', NULL, '2026-02-24 02:03:48'),
(31, 12, 'CREATE', 'senior_citizen_discounts', 2, 'Created SC-2026-0002', '::1', NULL, '2026-02-24 02:04:09'),
(32, 12, 'LOGOUT', NULL, NULL, 'User Santos, Juan D. logged out', '::1', NULL, '2026-02-24 02:04:11'),
(33, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 02:04:18'),
(34, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 02:14:57'),
(35, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 02:16:06'),
(36, 1, 'ASSIGN', NULL, NULL, 'Assigned W006 on SR-2026-0002', '::1', NULL, '2026-02-24 02:17:34'),
(37, 1, 'UPDATE', 'service_requests', NULL, 'SR-2026-0002 → Completed', '::1', NULL, '2026-02-24 02:17:36'),
(38, 1, 'UPDATE', 'workers', 6, 'Worker status changed to On Leave', '::1', NULL, '2026-02-24 02:20:57'),
(39, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 02:21:04'),
(40, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 02:21:14'),
(41, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-24 02:26:49'),
(42, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', NULL, '2026-02-24 02:27:05'),
(43, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', NULL, '2026-02-24 04:49:03'),
(44, 11, 'LOGIN', NULL, NULL, 'User Casis, Monica C. logged in as Member / Consumer', '::1', NULL, '2026-02-24 04:50:54'),
(45, 11, 'CREATE', 'service_requests', 3, 'Created SR-2026-0003 — No Light', '::1', NULL, '2026-02-24 04:52:21'),
(46, 11, 'LOGOUT', NULL, NULL, 'User Casis, Monica C. logged out', '::1', NULL, '2026-02-24 04:52:36'),
(47, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 04:52:48'),
(48, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 04:55:14'),
(49, 6, 'LOGIN', NULL, NULL, 'User Rodel M. Balictar logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 04:55:56'),
(50, 6, 'LOGOUT', NULL, NULL, 'User Rodel M. Balictar logged out', '::1', NULL, '2026-02-24 04:56:00'),
(51, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 04:56:05'),
(52, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-24 04:58:27'),
(53, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 04:58:43'),
(54, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:00:50'),
(55, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:01:10'),
(56, 1, 'CREATE', 'workers', 7, 'Added worker: Lorenz Joshua Campoto (W007) — Crew Alpha', '::1', NULL, '2026-02-24 05:02:10'),
(57, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:02:19'),
(58, 15, 'LOGIN', NULL, NULL, 'User Lorenz Joshua Campoto logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 05:02:28'),
(59, 15, 'LOGOUT', NULL, NULL, 'User Lorenz Joshua Campoto logged out', '::1', NULL, '2026-02-24 05:02:42'),
(60, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', NULL, '2026-02-24 05:03:01'),
(61, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', NULL, '2026-02-24 05:03:29'),
(62, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:03:37'),
(63, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:09:09'),
(64, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:09:18'),
(65, 1, 'CREATE', 'members', 7, 'Registered member: abenales, Brix Laurence (05-0783-0754)', '::1', NULL, '2026-02-24 05:10:45'),
(66, 1, 'CREATE', 'senior_citizen_discounts', 3, 'Created SC-2026-0003', '::1', NULL, '2026-02-24 05:12:07'),
(67, 1, 'APPROVE', 'senior_citizen_discounts', NULL, 'Approved SC-2026-0003', '::1', NULL, '2026-02-24 05:12:16'),
(68, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:12:29'),
(69, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:12:44'),
(70, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:13:09'),
(71, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:13:50'),
(72, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:14:05'),
(73, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:14:20'),
(74, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:14:53'),
(75, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:15:10'),
(76, 1, 'CREATE', 'workers', 8, 'Added worker: Brix (W008) — Crew Charlie', '::1', NULL, '2026-02-24 05:16:53'),
(77, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:17:00'),
(78, 16, 'LOGIN', NULL, NULL, 'User Brix logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 05:17:08'),
(79, 16, 'LOGOUT', NULL, NULL, 'User Brix logged out', '::1', NULL, '2026-02-24 05:19:27'),
(80, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:19:36'),
(81, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:34:43'),
(82, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:35:28'),
(83, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:40:40'),
(84, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:45:33'),
(85, 1, 'DELETE', 'workers', 8, 'Deleted worker: Brix (W008)', '::1', NULL, '2026-02-24 05:45:49'),
(86, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:45:58'),
(87, 6, 'LOGIN', NULL, NULL, 'User Rodel M. Balictar logged in as Field Worker / Crew', '::1', NULL, '2026-02-24 05:46:11'),
(88, 6, 'UPDATE', 'workers', 1, 'Worker Rodel M. Balictar status → On Leave (self-update)', '::1', NULL, '2026-02-24 05:46:21'),
(89, 6, 'LOGOUT', NULL, NULL, 'User Rodel M. Balictar logged out', '::1', NULL, '2026-02-24 05:46:25'),
(90, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:46:32'),
(91, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:51:09'),
(92, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 05:53:39'),
(93, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 05:54:09'),
(94, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 06:28:52'),
(95, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 06:35:21'),
(96, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 06:35:24'),
(97, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 06:51:30'),
(98, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 06:51:45'),
(99, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 06:53:21'),
(100, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 06:54:07'),
(101, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 06:54:29'),
(102, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 06:54:38'),
(103, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', NULL, '2026-02-24 06:54:52'),
(104, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', NULL, '2026-02-24 06:55:10'),
(105, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 06:55:36'),
(106, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-24 06:57:53'),
(107, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-24 06:58:06'),
(108, 13, 'CREATE', 'senior_citizen_discounts', 4, 'Created SC-2026-0004', '::1', NULL, '2026-02-24 06:58:39'),
(109, 13, 'CREATE', 'senior_citizen_discounts', 4, 'Uploaded 4 document(s) for SC-2026-0004', '::1', NULL, '2026-02-24 06:58:39'),
(110, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-24 06:59:50'),
(111, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-24 06:59:59'),
(112, 1, 'UPDATE', 'service_requests', NULL, 'SR-2026-0003 → In Progress', '::1', NULL, '2026-02-24 07:01:10'),
(113, 1, 'ASSIGN', NULL, NULL, 'Assigned W003 on SR-2026-0003', '::1', NULL, '2026-02-24 07:01:24'),
(114, 1, 'UPDATE', 'service_requests', NULL, 'SR-2026-0003 → Completed', '::1', NULL, '2026-02-24 07:01:25'),
(115, 1, 'UPDATE', 'workers', 1, 'Worker Rodel M. Balictar status → On Job', '::1', NULL, '2026-02-24 07:26:23'),
(116, 1, 'UPDATE', 'workers', 1, 'Worker Rodel M. Balictar status → Available', '::1', NULL, '2026-02-24 07:26:33'),
(117, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 06:39:32'),
(118, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 06:39:51'),
(119, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-25 06:40:51'),
(120, 13, 'CREATE', 'service_requests', 4, 'Created SR-2026-0004 — Loose Connection', '::1', NULL, '2026-02-25 06:41:05'),
(121, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-25 06:41:09'),
(122, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 06:41:32'),
(123, 1, 'ASSIGN', NULL, NULL, 'Assigned W006 on SR-2026-0004', '::1', NULL, '2026-02-25 06:41:42'),
(124, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 06:41:47'),
(125, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-25 06:42:02'),
(126, 14, 'UPDATE', 'workers', 6, 'Worker JP Marin status → Available (self-update)', '::1', NULL, '2026-02-25 06:42:18'),
(127, 14, 'UPDATE', 'service_requests', NULL, 'SR-2026-0004 → Completed', '::1', NULL, '2026-02-25 06:42:21'),
(128, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-25 06:43:00'),
(129, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 06:43:11'),
(130, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 06:44:39'),
(131, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-25 06:45:03'),
(132, 13, 'CREATE', 'service_requests', 5, 'Created SR-2026-0005 — Reconnection', '::1', NULL, '2026-02-25 06:45:15'),
(133, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-25 06:45:18'),
(134, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-25 06:45:40'),
(135, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-25 06:45:48'),
(136, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 06:46:02'),
(137, 1, 'ASSIGN', NULL, NULL, 'Assigned W006 on SR-2026-0005', '::1', NULL, '2026-02-25 06:46:13'),
(138, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 06:46:16'),
(139, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-25 06:46:31'),
(140, 14, 'UPDATE', 'service_requests', NULL, 'JP Marin declined SR-2026-0005: Kay na dire ma ak', '::1', NULL, '2026-02-25 06:46:50'),
(141, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-25 06:46:54'),
(142, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-25 06:47:03'),
(143, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-25 06:49:13'),
(144, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-25 06:49:53'),
(145, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-25 06:50:05'),
(146, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 06:50:19'),
(147, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 06:50:56'),
(148, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-25 06:51:11'),
(149, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-25 06:51:40'),
(150, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 06:53:55'),
(151, 1, 'CREATE', 'members', 8, 'Registered member: Campoto, Lorenz (05-0294-0307)', '::1', NULL, '2026-02-25 06:55:35'),
(152, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 07:04:52'),
(153, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 07:05:09'),
(154, 1, 'CREATE', 'users', 17, 'Created user: Kenn (Ciar) as consumer | Account 05-0826-0811', '::1', NULL, '2026-02-25 07:06:38'),
(155, 1, 'DELETE', 'users', 16, 'Deleted user: Brix (bl, worker)', '::1', NULL, '2026-02-25 07:14:04'),
(156, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 07:14:27'),
(157, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 07:15:11'),
(158, 1, 'DELETE', 'users', 16, 'Deleted user: Brix (bl, worker)', '::1', NULL, '2026-02-25 07:15:57'),
(159, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 07:16:24'),
(160, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 07:17:58'),
(161, 1, 'DELETE', 'users', 16, 'Deleted user: Brix (bl, worker)', '::1', NULL, '2026-02-25 07:18:06'),
(162, 1, 'DELETE', 'users', 10, 'Deleted user: Ryan G. Oben (crew_ryan, worker)', '::1', NULL, '2026-02-25 07:20:37'),
(163, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 07:26:19'),
(164, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-25 07:27:32'),
(165, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-25 07:27:48'),
(166, 17, 'LOGIN', NULL, NULL, 'User Kenn logged in as Member / Consumer', '::1', NULL, '2026-02-25 07:42:11'),
(167, 17, 'LOGOUT', NULL, NULL, 'User Kenn logged out', '::1', NULL, '2026-02-25 07:42:19'),
(168, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-25 08:03:29'),
(169, 1, 'CREATE', 'users', 18, 'Created user: Brix Laurence M. Abenales (Brix) as consumer | Account 05-0881-0286', '::1', NULL, '2026-02-25 08:06:33'),
(170, 1, 'DELETE', 'users', 18, 'Deleted user: Brix Laurence M. Abenales (Brix, consumer)', '::1', NULL, '2026-02-25 08:07:36'),
(171, 1, 'CREATE', 'users', 19, 'Created user: Brix Laurence M. Abenales (X) as consumer | Account 05-0108-0383', '::1', NULL, '2026-02-25 08:09:20'),
(172, 1, 'DELETE', 'users', 19, 'Deleted user: Brix Laurence M. Abenales (X, consumer)', '::1', NULL, '2026-02-25 08:13:41'),
(173, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-25 08:21:04'),
(174, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 04:42:34'),
(175, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 04:46:30'),
(176, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', NULL, '2026-02-26 04:47:14'),
(177, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', NULL, '2026-02-26 05:06:18'),
(178, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 05:08:07'),
(179, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 05:08:21'),
(180, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-26 05:08:47'),
(181, 13, 'CREATE', 'service_requests', 6, 'Created SR-2026-0006 — High Bill', '::1', NULL, '2026-02-26 05:09:38'),
(182, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 05:10:55'),
(183, 1, 'UPDATE', 'service_requests', NULL, 'SR-2026-0006 → In Progress', '::1', NULL, '2026-02-26 05:11:13'),
(184, 1, 'ASSIGN', NULL, NULL, 'Assigned W006 on SR-2026-0006', '::1', NULL, '2026-02-26 05:11:24'),
(185, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 05:11:33'),
(186, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-26 05:11:47'),
(187, 14, 'UPDATE', 'service_requests', NULL, 'SR-2026-0006 → Completed', '::1', NULL, '2026-02-26 05:11:51'),
(188, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-26 05:15:06'),
(189, 12, 'LOGIN', NULL, NULL, 'User Santos, Juan D. logged in as Member / Consumer', '::1', NULL, '2026-02-26 05:15:46'),
(190, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-26 05:15:52'),
(191, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 05:16:20'),
(192, 12, 'CREATE', 'service_requests', 7, 'Created SR-2026-0007 — High Bill', '::1', NULL, '2026-02-26 05:16:46'),
(193, 1, 'UPDATE', 'service_requests', NULL, 'SR-2026-0007 → In Progress', '::1', NULL, '2026-02-26 05:17:23'),
(194, 1, 'ASSIGN', NULL, NULL, 'Assigned W006 on SR-2026-0007', '::1', NULL, '2026-02-26 05:18:14'),
(195, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 05:18:17'),
(196, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-26 05:18:32'),
(197, 14, 'UPDATE', 'service_requests', NULL, 'SR-2026-0007 → Completed', '::1', NULL, '2026-02-26 05:18:37'),
(198, 12, 'LOGOUT', NULL, NULL, 'User Santos, Juan D. logged out', '::1', NULL, '2026-02-26 05:37:32'),
(199, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-26 05:39:50'),
(200, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 05:45:16'),
(201, 1, 'DELETE', 'users', 17, 'Deleted user: Kenn (Ciar, consumer)', '::1', NULL, '2026-02-26 05:45:43'),
(202, 1, 'DELETE', 'users', 22, 'Deleted user: Kenn Henzly L. Ciar (kenn, consumer)', '::1', NULL, '2026-02-26 05:54:20'),
(203, 1, 'DELETE', 'users', 21, 'Deleted user: Kenn Henzly L. Ciar (K, consumer)', '::1', NULL, '2026-02-26 05:54:23'),
(204, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 05:54:32'),
(205, 20, 'LOGIN', NULL, NULL, 'User Kenn Henzly L. Ciar logged in as Member / Consumer', '::1', NULL, '2026-02-26 05:54:44'),
(206, 20, 'LOGOUT', NULL, NULL, 'User Kenn Henzly L. Ciar logged out', '::1', NULL, '2026-02-26 05:56:45'),
(207, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 05:57:02'),
(208, 1, 'DELETE', 'users', 20, 'Deleted user: Kenn Henzly L. Ciar (khlc, consumer)', '::1', NULL, '2026-02-26 05:57:11'),
(209, 1, 'APPROVE', 'senior_citizen_discounts', NULL, 'Approved SC-2026-0004', '::1', NULL, '2026-02-26 06:01:51'),
(210, 1, 'APPROVE', 'senior_citizen_discounts', NULL, 'Approved SC-2026-0002', '::1', NULL, '2026-02-26 06:02:07'),
(211, 1, 'UPDATE', 'workers', 1, 'Worker Rodel M. Balictar status → On Job', '::1', NULL, '2026-02-26 06:02:49'),
(212, 1, 'UPDATE', 'workers', 1, 'Worker Rodel M. Balictar status → Available', '::1', NULL, '2026-02-26 06:02:51'),
(213, 1, 'CREATE', 'members', 12, 'Registered member: Ciar, Kenn Henzly L. (05-0502-0498)', '::1', NULL, '2026-02-26 06:04:26'),
(214, 1, 'DELETE', 'users', 15, 'Deleted user: Lorenz Joshua Campoto (lor, worker)', '::1', NULL, '2026-02-26 06:15:32'),
(215, 1, 'CREATE', 'users', 23, 'Created user: Abdul K. Jabar (Abdul) as consumer | Account 01-0151-1650', '::1', NULL, '2026-02-26 06:26:17'),
(216, 1, 'DELETE', 'users', 23, 'Deleted user: Abdul K. Jabar (Abdul, consumer)', '::1', NULL, '2026-02-26 06:26:46'),
(217, 1, 'ASSIGN', NULL, NULL, 'Assigned W002 on SR-2026-0005', '::1', NULL, '2026-02-26 06:28:44'),
(218, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 06:39:12'),
(219, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 06:41:57'),
(220, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 06:48:41'),
(221, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-26 06:49:20'),
(222, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-26 08:04:21'),
(223, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-27 05:33:45'),
(224, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-27 05:33:51'),
(225, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-27 05:34:03'),
(226, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-27 05:34:37'),
(227, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-27 05:34:51'),
(228, 1, 'CREATE', 'users', 24, 'Created user: Lebron M. James (lebron) as consumer | Account 05-0922-0921', '::1', NULL, '2026-02-27 05:37:23'),
(229, 1, 'DELETE', 'users', 24, 'Deleted user: Lebron M. James (lebron, consumer)', '::1', NULL, '2026-02-27 05:38:15'),
(230, 1, 'CREATE', 'users', 25, 'Created user: Stephen L. Curry (curry) as consumer | Account 05-0821-8745', '::1', NULL, '2026-02-27 05:51:07'),
(231, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-27 05:51:33'),
(232, 25, 'LOGIN', NULL, NULL, 'User Stephen L. Curry logged in as Member / Consumer', '::1', NULL, '2026-02-27 05:51:48'),
(233, 25, 'CREATE', 'service_requests', 8, 'Created SR-2026-0008 — Reconnection', '::1', NULL, '2026-02-27 05:52:20'),
(234, 25, 'LOGOUT', NULL, NULL, 'User Stephen L. Curry logged out', '::1', NULL, '2026-02-27 05:52:23'),
(235, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-27 05:52:34'),
(236, 1, 'ASSIGN', NULL, NULL, 'Assigned W006 on SR-2026-0008', '::1', NULL, '2026-02-27 05:52:46'),
(237, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-27 05:52:50'),
(238, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', NULL, '2026-02-27 05:53:06'),
(239, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', NULL, '2026-02-27 06:10:31'),
(240, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', NULL, '2026-02-27 06:10:54'),
(241, 1, 'DELETE', 'users', 25, 'Deleted user: Stephen L. Curry (curry, consumer)', '::1', NULL, '2026-02-27 06:11:24'),
(242, 1, 'UPDATE', 'service_requests', NULL, 'SR-2026-0008 → Completed', '::1', NULL, '2026-02-27 06:26:19'),
(243, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', NULL, '2026-02-27 06:27:06'),
(244, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', NULL, '2026-02-27 06:27:50'),
(245, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', NULL, '2026-02-27 06:28:06'),
(246, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', NULL, '2026-02-27 06:28:34'),
(247, 13, 'CREATE', 'service_requests', 9, 'Created SR-2026-0009 — SDW Sagging', '::1', NULL, '2026-02-27 06:28:43'),
(248, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', NULL, '2026-02-27 06:28:45'),
(249, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', NULL, '2026-02-27 06:29:02'),
(250, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 06:53:34'),
(251, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 06:53:51'),
(252, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 06:54:41'),
(253, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 06:56:27'),
(254, 1, '', 'users', 14, 'Admin reset password for: JP Marin (JP)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:00:50'),
(255, 1, '', 'users', 14, 'Admin reset password for: JP Marin (JP)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:00:57'),
(256, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:01:04'),
(257, 14, 'LOGIN', NULL, NULL, 'User JP Marin logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:01:23'),
(258, 14, '', 'users', 14, 'User JP Marin changed their password', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:02:47'),
(259, 14, 'LOGOUT', NULL, NULL, 'User JP Marin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:02:53'),
(260, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:03:11'),
(261, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-02-27 07:08:02'),
(262, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-01 23:50:29'),
(263, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-01 23:50:42'),
(264, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-01 23:59:32'),
(265, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-01 23:59:57'),
(266, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:00:45'),
(267, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:01:33'),
(268, 6, 'LOGIN', NULL, NULL, 'User Rodel M. Balictar logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:02:04'),
(269, 6, '', 'users', 6, 'User Rodel M. Balictar changed their password', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:02:37'),
(270, 6, 'LOGOUT', NULL, NULL, 'User Rodel M. Balictar logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:02:46'),
(271, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:03:01'),
(272, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:03:52'),
(273, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:04:05'),
(274, 13, 'CREATE', 'service_requests', 10, 'Created SR-2026-0010 — Meter Reading Error', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:04:18'),
(275, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:04:20'),
(276, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:04:41'),
(277, 1, 'ASSIGN', NULL, NULL, 'Assigned W002 on SR-2026-0010', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:05:04'),
(278, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:05:38'),
(279, 7, 'LOGIN', NULL, NULL, 'User Jay R. Montero logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:05:52'),
(280, 7, '', 'users', 7, 'User Jay R. Montero changed their password', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:06:13'),
(281, 7, 'UPDATE', 'service_requests', NULL, 'SR-2026-0010 → Completed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:07:34'),
(282, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:08:36'),
(283, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:10:24'),
(284, 7, 'LOGIN', NULL, NULL, 'User Jay R. Montero logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:10:56'),
(285, 7, 'LOGIN', NULL, NULL, 'User Jay R. Montero logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:15:56'),
(286, 7, 'LOGOUT', NULL, NULL, 'User Jay R. Montero logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:18:46'),
(287, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:18:58'),
(288, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:19:06'),
(289, 7, 'LOGIN', NULL, NULL, 'User Jay R. Montero logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:26:10'),
(290, 7, 'LOGIN', NULL, NULL, 'User Jay R. Montero logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 00:27:45'),
(291, 7, 'LOGIN', NULL, NULL, 'User Jay R. Montero logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:23:47'),
(292, 7, 'LOGIN', NULL, NULL, 'User Jay R. Montero logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:27:42'),
(293, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:30:04'),
(294, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:30:31'),
(295, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:31:12'),
(296, 1, '', 'users', 7, 'Admin reset password for: Jay R. Montero (crew_jay)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:31:54'),
(297, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:32:01'),
(298, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:33:28'),
(299, 1, 'CREATE', 'users', 26, 'Created user: James P. Harden (harden) as worker | Worker W009 (Crew Alpha)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:34:41'),
(300, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:34:56'),
(301, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:37:40'),
(302, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:38:14'),
(303, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:38:30'),
(304, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:38:46'),
(305, 9, 'LOGIN', NULL, NULL, 'User Dennis P. Cabrera logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:38:56'),
(306, 9, '', 'users', 9, 'User Dennis P. Cabrera changed their password', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:39:14'),
(307, 9, 'LOGOUT', NULL, NULL, 'User Dennis P. Cabrera logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:39:16'),
(308, 9, 'LOGIN', NULL, NULL, 'User Dennis P. Cabrera logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:39:21'),
(309, 9, 'LOGOUT', NULL, NULL, 'User Dennis P. Cabrera logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:39:25'),
(310, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:39:49'),
(311, 1, '', 'users', 26, 'Admin reset password for: James P. Harden (harden)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:40:02'),
(312, 1, '', 'users', 26, 'Admin reset password for: James P. Harden (harden)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:40:07'),
(313, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:40:12'),
(314, 26, 'LOGIN', NULL, NULL, 'User James P. Harden logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:40:21'),
(315, 26, 'LOGOUT', NULL, NULL, 'User James P. Harden logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:40:57'),
(316, 9, 'LOGIN', NULL, NULL, 'User Dennis P. Cabrera logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:41:49'),
(317, 9, 'LOGIN', NULL, NULL, 'User Dennis P. Cabrera logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:42:24'),
(318, 9, 'LOGOUT', NULL, NULL, 'User Dennis P. Cabrera logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-02 01:42:44'),
(319, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-03 05:36:45'),
(320, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-03 05:55:27'),
(321, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:17:47'),
(322, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:18:36'),
(323, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:33:50'),
(324, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:37:56'),
(325, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:38:33'),
(326, 13, 'LOGIN', NULL, NULL, 'User Reyes, Maria L. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:47:59'),
(327, 13, 'CREATE', 'service_requests', 11, 'Created SR-2026-0011 — Request Meter Test', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:48:30'),
(328, 13, 'LOGOUT', NULL, NULL, 'User Reyes, Maria L. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:48:33'),
(329, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:48:49'),
(330, 2, 'ASSIGN', NULL, NULL, 'Assigned W001 on SR-2026-0011', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:48:59'),
(331, 2, 'UPDATE', 'service_requests', NULL, 'SR-2026-0011 → Completed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:49:01'),
(332, 2, 'UPDATE', 'service_requests', NULL, 'SR-2026-0009 → In Progress', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:49:13'),
(333, 2, 'ASSIGN', NULL, NULL, 'Assigned W003 on SR-2026-0009', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:49:23'),
(334, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:49:56'),
(335, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:50:30'),
(336, 1, '', 'users', 8, 'Admin reset password for: Mark A. Tubigan (crew_mark)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:50:52'),
(337, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:50:57'),
(338, 8, 'LOGIN', NULL, NULL, 'User Mark A. Tubigan logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:51:05'),
(339, 8, 'UPDATE', 'service_requests', NULL, 'SR-2026-0009 → Completed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:51:23'),
(340, 8, 'LOGOUT', NULL, NULL, 'User Mark A. Tubigan logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:51:24'),
(341, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:51:56'),
(342, 2, 'ASSIGN', NULL, NULL, 'Unassigned on SR-2026-0005', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:52:10'),
(343, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 00:53:18'),
(344, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:22:17'),
(345, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:49:22'),
(346, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:49:58'),
(347, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:50:04'),
(348, 11, 'LOGIN', NULL, NULL, 'User Casis, Monica C. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:50:28'),
(349, 11, 'LOGOUT', NULL, NULL, 'User Casis, Monica C. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:51:18'),
(350, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:51:33'),
(351, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:54:29');
INSERT INTO `audit_log` (`log_id`, `user_id`, `action`, `module`, `ref_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(352, 11, 'LOGIN', NULL, NULL, 'User Casis, Monica C. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:54:41'),
(353, 11, 'LOGOUT', NULL, NULL, 'User Casis, Monica C. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:57:35'),
(354, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 01:57:45'),
(355, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:07:16'),
(356, 1, 'UPDATE', 'members', 1, 'Changed member status: Casis, Monica (05-0502-0497) → Disconnected', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:07:51'),
(357, 1, 'UPDATE', 'members', 1, 'Changed member status: Casis, Monica (05-0502-0497) → Active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:07:57'),
(358, 1, 'UPDATE', 'members', 1, 'Changed member status: Casis, Monica (05-0502-0497) → Disconnected', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:08:15'),
(359, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:08:18'),
(360, 11, 'LOGIN', NULL, NULL, 'User Casis, Monica C. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:08:32'),
(361, 11, 'CREATE', 'service_requests', 12, 'Created SR-2026-0012 — Reconnection', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:08:53'),
(362, 11, 'LOGOUT', NULL, NULL, 'User Casis, Monica C. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:08:56'),
(363, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:09:13'),
(364, 2, 'ASSIGN', NULL, NULL, 'Assigned W009 on SR-2026-0012', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:09:25'),
(365, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:09:48'),
(366, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:10:04'),
(367, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:10:21'),
(368, 26, 'LOGIN', NULL, NULL, 'User James P. Harden logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:10:32'),
(369, 26, 'UPDATE', 'service_requests', NULL, 'SR-2026-0012 → Completed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:10:41'),
(370, 26, 'LOGOUT', NULL, NULL, 'User James P. Harden logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:10:42'),
(371, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:11:09'),
(372, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:11:33'),
(373, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:11:45'),
(374, 1, 'UPDATE', 'members', 1, 'Changed member status: Casis, Monica (05-0502-0497) → Active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:12:11'),
(375, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:19:06'),
(376, 2, 'UPDATE', 'members', 1, 'Changed member status: Casis, Monica (05-0502-0497) → Disconnected', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:19:17'),
(377, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:19:20'),
(378, 11, 'LOGIN', NULL, NULL, 'User Casis, Monica C. logged in as Member / Consumer', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:19:33'),
(379, 11, 'CREATE', 'service_requests', 13, 'Created SR-2026-0013 — Reconnection', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:19:45'),
(380, 11, 'LOGOUT', NULL, NULL, 'User Casis, Monica C. logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:19:48'),
(381, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:20:07'),
(382, 2, 'ASSIGN', NULL, NULL, 'Assigned W009 on SR-2026-0013', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:20:17'),
(383, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:20:21'),
(384, 26, 'LOGIN', NULL, NULL, 'User James P. Harden logged in as Field Worker / Crew', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:20:33'),
(385, 26, 'UPDATE', 'members', 1, 'Auto-reactivated member: Casis, Monica (05-0502-0497) after Reconnection SR SR-2026-0013 completed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:20:41'),
(386, 26, 'UPDATE', 'service_requests', NULL, 'SR-2026-0013 → Completed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:20:41'),
(387, 26, 'LOGOUT', NULL, NULL, 'User James P. Harden logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:20:43'),
(388, 2, 'LOGIN', NULL, NULL, 'User Bernadette A. Capada logged in as CWDO Staff', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:21:03'),
(389, 2, 'LOGOUT', NULL, NULL, 'User Bernadette A. Capada logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:22:13'),
(390, 1, 'LOGIN', NULL, NULL, 'User Admin User logged in as System Administrator', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 02:22:26'),
(391, 1, 'LOGOUT', NULL, NULL, 'User Admin User logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', '2026-03-05 03:25:52');

-- --------------------------------------------------------

--
-- Table structure for table `billing_history`
--

CREATE TABLE `billing_history` (
  `billing_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `kwh_used` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `due_date` date NOT NULL,
  `payment_status` enum('Unpaid','Paid','Overdue','Partial') NOT NULL DEFAULT 'Unpaid',
  `paid_at` timestamp NULL DEFAULT NULL,
  `paid_amount` decimal(12,2) DEFAULT NULL,
  `or_number` varchar(30) DEFAULT NULL,
  `sc_discount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `document_id` int(11) NOT NULL,
  `ref_type` enum('member','service_request','reconnection','meter_change','senior_discount') NOT NULL,
  `ref_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size_kb` int(11) NOT NULL,
  `mime_type` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`document_id`, `ref_type`, `ref_id`, `file_name`, `file_path`, `file_size_kb`, `mime_type`, `description`, `uploaded_by`, `uploaded_at`) VALUES
(1, 'senior_discount', 4, 'Screenshot (1).png', 'uploads/sc/SC-2026-0004_1771916319_0.png', 76, 'image/png', 'Proof of Age & Citizenship', 13, '2026-02-24 06:58:39'),
(2, 'senior_discount', 4, 'Screenshot (2).png', 'uploads/sc/SC-2026-0004_1771916319_1.png', 29, 'image/png', 'Proof of Residence', 13, '2026-02-24 06:58:39'),
(3, 'senior_discount', 4, 'Screenshot (3).png', 'uploads/sc/SC-2026-0004_1771916319_2.png', 24, 'image/png', 'Proof of Billing', 13, '2026-02-24 06:58:39'),
(4, 'senior_discount', 4, 'Screenshot (4).png', 'uploads/sc/SC-2026-0004_1771916319_3.png', 146, 'image/png', 'Authorization Letter', 13, '2026-02-24 06:58:39');

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `username`, `ip_address`, `attempted_at`) VALUES
(30, 'cdwo_staff', '::1', '2026-03-05 00:51:49'),
(31, 'monica_asis', '::1', '2026-03-05 01:49:41');

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `member_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `account_no` varchar(20) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_initial` varchar(10) DEFAULT NULL,
  `sex` enum('Male','Female') DEFAULT NULL,
  `civil_status` enum('Single','Married','Widowed','Separated') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address_purok` varchar(50) DEFAULT NULL,
  `address_brgy` varchar(100) DEFAULT NULL,
  `address_muni` varchar(100) DEFAULT 'Borongan',
  `address_province` varchar(100) DEFAULT 'Eastern Samar',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `meter_no` varchar(20) NOT NULL,
  `connection_type` enum('Residential','Commercial','Industrial') NOT NULL DEFAULT 'Residential',
  `house_ownership` enum('Owned','Rented') DEFAULT NULL,
  `status` enum('Active','Pending','Disconnected','Inactive') NOT NULL DEFAULT 'Active',
  `registered_at` date NOT NULL,
  `registered_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`member_id`, `user_id`, `account_no`, `first_name`, `last_name`, `middle_initial`, `sex`, `civil_status`, `date_of_birth`, `address_purok`, `address_brgy`, `address_muni`, `address_province`, `latitude`, `longitude`, `phone`, `email`, `meter_no`, `connection_type`, `house_ownership`, `status`, `registered_at`, `registered_by`, `created_at`, `updated_at`) VALUES
(1, 11, '05-0502-0497', 'Monica', 'Casis', 'C.', NULL, NULL, NULL, NULL, 'Brgy. 6', 'San Julian', 'Eastern Samar', 11.60860000, 125.43620000, '09171234567', NULL, '1263130217', 'Residential', NULL, 'Active', '2024-03-15', 1, '2026-02-24 01:09:15', '2026-03-05 02:20:41'),
(2, 12, '05-0321-0088', 'Juan', 'Santos', 'D.', NULL, NULL, NULL, NULL, 'Brgy. Cabong', 'Borongan', 'Eastern Samar', 11.60920000, 125.43780000, '09181234567', NULL, '1263130445', 'Residential', NULL, 'Active', '2024-06-20', 1, '2026-02-24 01:09:15', '2026-02-27 05:28:31'),
(3, 13, '05-0412-0156', 'Maria', 'Reyes', 'L.', NULL, NULL, NULL, NULL, 'Brgy. Campato', 'Borongan', 'Eastern Samar', 11.60750000, 125.43450000, '09191234567', NULL, '1263130891', 'Commercial', NULL, 'Active', '2023-11-10', 1, '2026-02-24 01:09:15', '2026-02-27 05:28:31'),
(4, NULL, '05-0108-0234', 'Pedro', 'Dela Cruz', 'B.', NULL, NULL, NULL, NULL, 'Brgy. Sabang', 'Borongan', 'Eastern Samar', 11.61000000, 125.43950000, '09201234567', NULL, '1263131012', 'Residential', NULL, 'Disconnected', '2022-08-05', 1, '2026-02-24 01:09:15', '2026-02-27 05:28:32'),
(5, NULL, '05-0215-0089', 'Elena', 'Garcia', 'R.', NULL, NULL, NULL, NULL, 'Brgy. Bato', 'Borongan', 'Eastern Samar', 11.60680000, 125.43300000, '09211234567', NULL, '1263131234', 'Residential', NULL, 'Active', '2025-01-18', 1, '2026-02-24 01:09:15', '2026-02-27 05:28:32'),
(6, NULL, '05-0193-0441', 'JP', 'Marin', '', NULL, NULL, NULL, NULL, 'Brgy. Nagaja, Hernani', 'Borongan', 'Eastern Samar', NULL, NULL, '1234567890', 'jp@gmail.com', '1263134947', 'Residential', NULL, 'Active', '2026-02-24', 1, '2026-02-24 01:59:20', '2026-02-24 01:59:20'),
(7, NULL, '05-0783-0754', 'Brix Laurence', 'abenales', '', NULL, NULL, NULL, NULL, 'biringan', 'Borongan', 'Eastern Samar', NULL, NULL, '09563885934459', 'bl@gmail.com', '1263133913', 'Residential', NULL, 'Active', '2026-02-24', 1, '2026-02-24 05:10:45', '2026-02-24 05:10:45'),
(9, 17, '05-0826-0811', 'Kenn', 'Ciar', NULL, NULL, NULL, NULL, NULL, 'Maytigbao', 'Borongan', 'Eastern Samar', NULL, NULL, '12345678901', 'ggg@gmail.com', '1263137933', 'Residential', NULL, 'Inactive', '2026-02-25', 1, '2026-02-25 07:06:38', '2026-02-26 05:45:43'),
(10, 18, '05-0881-0286', 'Brix Laurence', 'Abenales', NULL, NULL, NULL, NULL, NULL, 'Brgy. San Eduardo, Oras', 'Borongan', 'Eastern Samar', NULL, NULL, '098765432101', 'brix@gmail.com', '1263138367', 'Residential', NULL, 'Active', '2026-02-25', 1, '2026-02-25 08:06:33', '2026-02-25 08:06:33'),
(11, 19, '05-0108-0383', 'Brix Laurence', 'Abenales', NULL, NULL, NULL, NULL, NULL, 'San Eduardo', 'Borongan', 'Eastern Samar', NULL, NULL, '098765432101', 'brix@gmail.com', '1263133899', 'Residential', NULL, 'Active', '2026-02-25', 1, '2026-02-25 08:09:20', '2026-02-25 08:09:20'),
(15, 25, '05-0821-8745', 'Stephen L.', 'Curry', NULL, NULL, NULL, NULL, NULL, 'Rawis', 'Borongan', 'Eastern Samar', 11.60685255, 125.44209482, '12345678901', 'curry@gmail.com', '1263139870', 'Residential', NULL, 'Inactive', '2026-02-27', 1, '2026-02-27 05:51:07', '2026-02-27 06:11:24');

-- --------------------------------------------------------

--
-- Table structure for table `meters`
--

CREATE TABLE `meters` (
  `meter_id` int(11) NOT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `meter_no` varchar(30) NOT NULL,
  `last_reading` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ampere` varchar(10) DEFAULT NULL,
  `volts` varchar(10) DEFAULT NULL,
  `multiplier` varchar(10) DEFAULT '1',
  `seal_no` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `installed_at` date DEFAULT NULL,
  `removed_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meter_change_orders`
--

CREATE TABLE `meter_change_orders` (
  `mc_id` int(11) NOT NULL,
  `mc_number` varchar(20) NOT NULL,
  `member_id` int(11) NOT NULL,
  `reason` enum('Defective Meter','Meter Upgrade','Burnt Meter','Meter Testing','Consumer Request','Others') NOT NULL,
  `old_meter_id` int(11) NOT NULL,
  `new_meter_id` int(11) NOT NULL,
  `status` enum('Pending','Approved','Rejected','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `remarks` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` int(11) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notif_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `ref_type` varchar(50) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reconnection_orders`
--

CREATE TABLE `reconnection_orders` (
  `ro_id` int(11) NOT NULL,
  `ro_number` varchar(20) NOT NULL,
  `member_id` int(11) NOT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `tor_cr_no` varchar(30) DEFAULT NULL,
  `power_bills` decimal(12,2) NOT NULL DEFAULT 0.00,
  `surcharge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `recon_fee` decimal(12,2) NOT NULL DEFAULT 150.00,
  `meter_seal_fee` decimal(12,2) NOT NULL DEFAULT 90.00,
  `others_vat` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) GENERATED ALWAYS AS (`power_bills` + `surcharge` + `recon_fee` + `meter_seal_fee` + `others_vat`) STORED,
  `status` enum('Pending','Approved','Rejected','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `prepared_by` int(11) NOT NULL,
  `prepared_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `checked_by` int(11) DEFAULT NULL,
  `checked_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` int(11) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `assigned_worker_id` int(11) DEFAULT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `completed_by_worker` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_key` varchar(30) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `can_create` tinyint(1) NOT NULL DEFAULT 0,
  `can_approve` tinyint(1) NOT NULL DEFAULT 0,
  `can_view_audit` tinyint(1) NOT NULL DEFAULT 0,
  `can_assign` tinyint(1) NOT NULL DEFAULT 0,
  `approval_level` tinyint(4) NOT NULL DEFAULT 0,
  `is_consumer` tinyint(1) NOT NULL DEFAULT 0,
  `is_worker` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_key`, `role_name`, `can_create`, `can_approve`, `can_view_audit`, `can_assign`, `approval_level`, `is_consumer`, `is_worker`, `created_at`) VALUES
(1, 'admin', 'System Administrator', 1, 1, 1, 1, 5, 0, 0, '2026-02-24 01:09:13'),
(2, 'cwdo', 'CWDO Staff', 1, 0, 0, 1, 1, 0, 0, '2026-02-24 01:09:13'),
(3, 'cao_disco', 'CAO Disco Head', 1, 1, 1, 1, 2, 0, 0, '2026-02-24 01:09:13'),
(4, 'cao_manager', 'CAO Area Manager', 1, 1, 1, 1, 3, 0, 0, '2026-02-24 01:09:13'),
(5, 'gm', 'General Manager', 0, 1, 1, 1, 4, 0, 0, '2026-02-24 01:09:13'),
(6, 'worker', 'Field Worker / Crew', 0, 0, 0, 0, 0, 0, 1, '2026-02-24 01:09:13'),
(7, 'consumer', 'Member / Consumer', 0, 0, 0, 0, 0, 1, 0, '2026-02-24 01:09:13');

-- --------------------------------------------------------

--
-- Table structure for table `sc_document_checklist`
--

CREATE TABLE `sc_document_checklist` (
  `checklist_id` int(11) NOT NULL,
  `sc_id` int(11) NOT NULL,
  `doc_type` enum('Proof of Age & Citizenship','Proof of Residence','Proof of Billing','Authorization Letter') NOT NULL,
  `is_submitted` tinyint(1) NOT NULL DEFAULT 0,
  `file_path` varchar(500) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sc_document_checklist`
--

INSERT INTO `sc_document_checklist` (`checklist_id`, `sc_id`, `doc_type`, `is_submitted`, `file_path`, `submitted_at`) VALUES
(1, 1, 'Proof of Age & Citizenship', 1, NULL, '2026-02-23 19:02:27'),
(2, 1, 'Proof of Residence', 1, NULL, '2026-02-23 19:02:27'),
(3, 1, 'Proof of Billing', 1, NULL, '2026-02-23 19:02:27'),
(4, 1, 'Authorization Letter', 1, NULL, '2026-02-23 19:02:27'),
(5, 2, 'Proof of Age & Citizenship', 1, NULL, '2026-02-23 19:04:09'),
(6, 2, 'Proof of Residence', 1, NULL, '2026-02-23 19:04:09'),
(7, 2, 'Proof of Billing', 1, NULL, '2026-02-23 19:04:09'),
(8, 2, 'Authorization Letter', 1, NULL, '2026-02-23 19:04:09'),
(9, 3, 'Proof of Age & Citizenship', 1, NULL, '2026-02-23 22:12:07'),
(10, 3, 'Proof of Residence', 1, NULL, '2026-02-23 22:12:07'),
(11, 3, 'Proof of Billing', 1, NULL, '2026-02-23 22:12:07'),
(12, 3, 'Authorization Letter', 1, NULL, '2026-02-23 22:12:07'),
(13, 4, 'Proof of Age & Citizenship', 1, NULL, '2026-02-23 23:58:39'),
(14, 4, 'Proof of Residence', 1, NULL, '2026-02-23 23:58:39'),
(15, 4, 'Proof of Billing', 1, NULL, '2026-02-23 23:58:39'),
(16, 4, 'Authorization Letter', 1, NULL, '2026-02-23 23:58:39');

-- --------------------------------------------------------

--
-- Table structure for table `senior_citizen_discounts`
--

CREATE TABLE `senior_citizen_discounts` (
  `sc_id` int(11) NOT NULL,
  `sc_number` varchar(20) NOT NULL,
  `member_id` int(11) NOT NULL,
  `osca_id` varchar(50) NOT NULL,
  `date_of_birth` date NOT NULL,
  `age` tinyint(4) NOT NULL,
  `status` enum('Pending','Approved','Rejected','Expired') NOT NULL DEFAULT 'Pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` int(11) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `senior_citizen_discounts`
--

INSERT INTO `senior_citizen_discounts` (`sc_id`, `sc_number`, `member_id`, `osca_id`, `date_of_birth`, `age`, `status`, `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `valid_until`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'SC-2026-0001', 1, '1243456789', '1950-04-02', 76, 'Approved', 4, '2026-02-24 02:03:07', NULL, NULL, NULL, 11, '2026-02-24 02:02:27', '2026-02-24 02:03:07'),
(2, 'SC-2026-0002', 2, '1243456789', '1950-04-02', 76, 'Approved', 1, '2026-02-26 06:02:07', NULL, NULL, NULL, 12, '2026-02-24 02:04:09', '2026-02-26 06:02:07'),
(3, 'SC-2026-0003', 7, '12135435632', '1910-01-26', 116, 'Approved', 1, '2026-02-24 05:12:16', NULL, NULL, NULL, 1, '2026-02-24 05:12:07', '2026-02-24 05:12:16'),
(4, 'SC-2026-0004', 3, '1234567', '1960-11-04', 62, 'Approved', 1, '2026-02-26 06:01:51', NULL, NULL, NULL, 13, '2026-02-24 06:58:39', '2026-02-26 06:01:51');

-- --------------------------------------------------------

--
-- Table structure for table `service_requests`
--

CREATE TABLE `service_requests` (
  `sr_id` int(11) NOT NULL,
  `sr_number` varchar(20) NOT NULL,
  `member_id` int(11) NOT NULL,
  `nature` enum('High Bill','Meter Reading Error','No Bill','Reconnection','Busted Transformer','Meter Relocation','Loose Connection','Request Meter Test','No Light','SDW Relocation','SDW Sagging','Cut SDW','Pole Relocation','New Connection','Others') NOT NULL,
  `status` enum('New','In Progress','Completed','Cancelled','Declined') NOT NULL DEFAULT 'New',
  `landmark` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `decline_reason` text DEFAULT NULL,
  `declined_by` int(11) DEFAULT NULL,
  `declined_at` timestamp NULL DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `assigned_worker_id` int(11) DEFAULT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `assigned_crew` varchar(150) DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `completed_by_worker` tinyint(1) DEFAULT 0,
  `filed_by` int(11) NOT NULL,
  `filed_at` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_requests`
--

INSERT INTO `service_requests` (`sr_id`, `sr_number`, `member_id`, `nature`, `status`, `landmark`, `remarks`, `decline_reason`, `declined_by`, `declined_at`, `contact_phone`, `latitude`, `longitude`, `assigned_worker_id`, `assigned_by`, `assigned_at`, `assigned_crew`, `completed_at`, `completed_by_worker`, `filed_by`, `filed_at`, `created_at`, `updated_at`) VALUES
(1, 'SR-2026-0001', 1, 'No Light', 'Completed', 'Harani hit simbahan', 'Nautod an poste', NULL, NULL, NULL, '', NULL, NULL, 6, 1, '2026-02-24 01:31:55', NULL, '2026-02-24 01:35:27', 0, 11, '2026-02-24', '2026-02-24 01:31:25', '2026-02-24 01:35:27'),
(2, 'SR-2026-0002', 1, 'New Connection', 'Completed', 'Harani hit simbahan', '', NULL, NULL, NULL, '', NULL, NULL, 6, 1, '2026-02-24 02:17:34', NULL, '2026-02-24 02:17:36', 0, 11, '2026-02-24', '2026-02-24 02:01:05', '2026-02-24 02:17:36'),
(3, 'SR-2026-0003', 1, 'No Light', 'Completed', 'Harani hit simbahan', '', NULL, NULL, NULL, '', NULL, NULL, 3, 1, '2026-02-24 07:01:24', NULL, '2026-02-24 07:01:25', 0, 11, '2026-02-24', '2026-02-24 04:52:21', '2026-02-24 07:01:25'),
(4, 'SR-2026-0004', 3, 'Loose Connection', 'Completed', 'Harani hit simbahan', '', NULL, NULL, NULL, '', NULL, NULL, 6, 1, '2026-02-25 06:41:42', NULL, '2026-02-25 06:42:21', 0, 13, '2026-02-25', '2026-02-25 06:41:05', '2026-02-25 06:42:21'),
(5, 'SR-2026-0005', 3, 'Reconnection', 'Declined', 'fsdfsd', '', 'Kay na dire ma ak', 14, '2026-02-25 06:46:50', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 13, '2026-02-25', '2026-02-25 06:45:15', '2026-03-05 00:52:10'),
(6, 'SR-2026-0006', 3, 'High Bill', 'Completed', 'Harani hit simbahan', 'sdfsd', NULL, NULL, NULL, '', NULL, NULL, 6, 1, '2026-02-26 05:11:24', NULL, '2026-02-26 05:11:51', 0, 13, '2026-02-26', '2026-02-26 05:09:38', '2026-02-26 05:11:51'),
(7, 'SR-2026-0007', 2, 'High Bill', 'Completed', 'hahahah', '', NULL, NULL, NULL, '', NULL, NULL, 6, 1, '2026-02-26 05:18:14', NULL, '2026-02-26 05:18:37', 0, 12, '2026-02-26', '2026-02-26 05:16:46', '2026-02-26 05:18:37'),
(8, 'SR-2026-0008', 15, 'Reconnection', 'Completed', 'Harani hit Hotel', 'magpapa connect', NULL, NULL, NULL, '', NULL, NULL, 6, 1, '2026-02-27 05:52:46', NULL, '2026-02-27 06:26:19', 0, 25, '2026-02-27', '2026-02-27 05:52:20', '2026-02-27 06:26:19'),
(9, 'SR-2026-0009', 3, 'SDW Sagging', 'Completed', 'Harani hit simbahan', '', NULL, NULL, NULL, '', NULL, NULL, 3, 2, '2026-03-05 00:49:23', NULL, '2026-03-05 00:51:23', 0, 13, '2026-02-27', '2026-02-27 06:28:43', '2026-03-05 00:51:23'),
(10, 'SR-2026-0010', 3, 'Meter Reading Error', 'Completed', 'sdfs', '', NULL, NULL, NULL, '', NULL, NULL, 2, 1, '2026-03-02 00:05:04', NULL, '2026-03-02 00:07:34', 0, 13, '2026-03-02', '2026-03-02 00:04:18', '2026-03-02 00:07:34'),
(11, 'SR-2026-0011', 3, 'Request Meter Test', 'Completed', 'Harani hit Hotel', 'jhjgjhk', NULL, NULL, NULL, '', NULL, NULL, 1, 2, '2026-03-05 00:48:59', NULL, '2026-03-05 00:49:01', 0, 13, '2026-03-05', '2026-03-05 00:48:30', '2026-03-05 00:49:01'),
(12, 'SR-2026-0012', 1, 'Reconnection', 'Completed', 'Harani hit Hotel', '', NULL, NULL, NULL, '', NULL, NULL, 9, 2, '2026-03-05 02:09:25', NULL, '2026-03-05 02:10:41', 0, 11, '2026-03-05', '2026-03-05 02:08:53', '2026-03-05 02:10:41'),
(13, 'SR-2026-0013', 1, 'Reconnection', 'Completed', 'Harani hit Hotel', '', NULL, NULL, NULL, '', NULL, NULL, 9, 2, '2026-03-05 02:20:17', NULL, '2026-03-05 02:20:41', 0, 11, '2026-03-05', '2026-03-05 02:19:45', '2026-03-05 02:20:41');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `password_change_required` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `full_name`, `email`, `phone`, `role_id`, `is_active`, `last_login`, `created_at`, `updated_at`, `password_change_required`) VALUES
(1, 'admin', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Admin User', NULL, NULL, 1, 1, '2026-03-05 02:22:26', '2026-02-24 01:09:15', '2026-03-05 02:22:26', 0),
(2, 'cwdo_staff', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Bernadette A. Capada', NULL, NULL, 2, 1, '2026-03-05 02:21:03', '2026-02-24 01:09:15', '2026-03-05 02:21:03', 0),
(3, 'disco_head', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Leoditha A. Perez', NULL, NULL, 3, 1, NULL, '2026-02-24 01:09:15', '2026-02-25 06:37:45', 0),
(4, 'cao_mgr', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Engr. Greg A. Lim It', NULL, NULL, 4, 1, '2026-02-24 02:02:52', '2026-02-24 01:09:15', '2026-02-25 06:37:45', 0),
(5, 'gen_mgr', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Jose Michael Edwin S. Amancio', NULL, NULL, 5, 1, NULL, '2026-02-24 01:09:15', '2026-02-25 06:37:45', 0),
(6, 'crew_rodel', '$2y$10$ig6RR0ngnoCyxq4Qide/culkY90itTmhRavGMLSKRTrK6kQX/UpTS', 'Rodel M. Balictar', NULL, NULL, 6, 1, '2026-03-02 00:02:04', '2026-02-24 01:09:15', '2026-03-02 00:02:37', 0),
(7, 'crew_jay', '$2y$10$GSMoz5vL.q9XJznkmaF97..xTRwW44xNmwFHb8o1/4evo/uiI1Tw6', 'Jay R. Montero', NULL, NULL, 6, 1, '2026-03-02 01:27:42', '2026-02-24 01:09:15', '2026-03-02 01:31:54', 1),
(8, 'crew_mark', '$2y$10$2RGsEvJHnYDn185t6diuCO2hkoHwle8HGsAruNFirqqQhc8jOtnVu', 'Mark A. Tubigan', NULL, NULL, 6, 1, '2026-03-05 00:51:05', '2026-02-24 01:09:15', '2026-03-05 00:51:05', 1),
(9, 'crew_dennis', '$2y$10$nBXSSrS6hpFoK6aRT5jB/.dbV63HMywlWDKKOGU06rUcoMnFTfOiO', 'Dennis P. Cabrera', NULL, NULL, 6, 1, '2026-03-02 01:42:24', '2026-02-24 01:09:15', '2026-03-02 01:42:24', 0),
(10, 'crew_ryan', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Ryan G. Oben', NULL, NULL, 6, 0, NULL, '2026-02-24 01:09:15', '2026-02-27 06:52:04', 1),
(11, 'monica_casis', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Casis, Monica C.', NULL, NULL, 7, 1, '2026-03-05 02:19:33', '2026-02-24 01:09:15', '2026-03-05 02:19:33', 0),
(12, 'juan_santos', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Santos, Juan D.', NULL, NULL, 7, 1, '2026-02-26 05:15:46', '2026-02-24 01:09:15', '2026-02-26 05:15:46', 0),
(13, 'maria_reyes', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Reyes, Maria L.', NULL, NULL, 7, 1, '2026-03-05 00:47:59', '2026-02-24 01:09:15', '2026-03-05 00:47:59', 0),
(14, 'JP', '$2y$10$tCSTRG5Bs43tneH1xoGSDuuI9sjnc5etHDkDV.NN6LQpXVvPmw3y6', 'JP Marin', NULL, NULL, 6, 1, '2026-02-27 07:01:23', '2026-02-24 01:29:06', '2026-02-27 07:02:47', 0),
(15, 'lor', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Lorenz Joshua Campoto', NULL, NULL, 6, 0, '2026-02-24 05:02:28', '2026-02-24 05:02:10', '2026-02-27 06:52:04', 1),
(16, 'bl', '$2y$10$qXJnGJE74LkU5ZBOjjahT.DorH47QA9YRVFDAOTeyfvO9YK6/GC.K', 'Brix', NULL, NULL, 6, 0, '2026-02-24 05:17:08', '2026-02-24 05:16:53', '2026-02-27 06:52:04', 1),
(17, 'Ciar', '$2y$10$07XuuDQWC9cOgFlOCkYFweu/9umGjT/Umu/X5nelL6RPCq81p0fmy', 'Kenn', 'ggg@gmail.com', '12345678901', 7, 0, '2026-02-25 07:42:11', '2026-02-25 07:06:38', '2026-02-26 05:45:43', 0),
(18, 'Brix', '$2y$10$nRHuFq33sppHJcSMV/T2GO.DM0j4tFAgq.qbXwDC.nqEkha1UWLsS', 'Brix Laurence M. Abenales', 'brix@gmail.com', '098765432101', 7, 0, NULL, '2026-02-25 08:06:33', '2026-02-25 08:07:36', 0),
(19, 'X', '$2y$10$7ZoPb0iodYjj9BA5iKc6weuRjOlxiUDXGkc8Sr0vULH4I0H530S7y', 'Brix Laurence M. Abenales', 'brix@gmail.com', '098765432101', 7, 0, NULL, '2026-02-25 08:09:20', '2026-02-25 08:13:41', 0),
(20, 'khlc', '$2y$10$MSL1YXnZXI6evat7qCTRc.bijO58yuC73Q8lQaxclwghS0GtcAkrW', 'Kenn Henzly L. Ciar', 'khlc@gmail.com', '12345678901', 7, 0, '2026-02-26 05:54:44', '2026-02-26 05:50:47', '2026-02-26 05:57:11', 0),
(21, 'K', '$2y$10$9jJExglm5FEIaUd5vq5Uue6jvIBGudO4cGnoCTeKIZKB2pDLnQrm.', 'Kenn Henzly L. Ciar', 'khlc@gmail.com', '12345678901', 7, 0, NULL, '2026-02-26 05:52:27', '2026-02-26 05:54:23', 0),
(22, 'kenn', '$2y$10$h1.EzyovUgsO5pWweMhuau9DaO7DsOS0azlWXF6mc2JKMUA/az9Im', 'Kenn Henzly L. Ciar', 'khlc@gmail.com', '12345678901', 7, 0, NULL, '2026-02-26 05:52:41', '2026-02-26 05:54:20', 0),
(23, 'Abdul', '$2y$10$e26hakK1nZgg7HitJgMo0OqUyGLFgS/oRvEeTEkdXB0LbXQVN5Bhu', 'Abdul K. Jabar', 'a@gmail.com', '12345678901', 7, 0, NULL, '2026-02-26 06:26:17', '2026-02-26 06:26:46', 0),
(24, 'lebron', '$2y$10$xOdH9yvgPgrcTQnklPADLe6IsinJwERHIjFkwbKr.3FqmF8bLRzi2', 'Lebron M. James', 'lebron@gmail.com', '12345678901', 7, 0, NULL, '2026-02-27 05:37:23', '2026-02-27 05:38:15', 0),
(25, 'curry', '$2y$10$kC2s57GCiaoQ2wKpSihnTeYRKdysTPSRIhJz.35fJtOOejzgVA3CO', 'Stephen L. Curry', 'curry@gmail.com', '12345678901', 7, 0, '2026-02-27 05:51:48', '2026-02-27 05:51:07', '2026-02-27 06:11:24', 0),
(26, 'harden', '$2y$10$ZKKhRx/6MFVASMixas64oulTZLz0eA3WV2DjHQqwP09Ze4i0YXHMe', 'James P. Harden', 'harden@gmail.com', '12345678901', 6, 1, '2026-03-05 02:20:33', '2026-03-02 01:34:41', '2026-03-05 02:20:33', 1);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_dashboard_stats`
-- (See below for the actual view)
--
CREATE TABLE `v_dashboard_stats` (
`total_members` bigint(21)
,`open_srs` bigint(21)
,`pending_recons` bigint(21)
,`awaiting_approval` bigint(21)
,`available_workers` bigint(21)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_pending_approvals`
-- (See below for the actual view)
--
CREATE TABLE `v_pending_approvals` (
`type` varchar(15)
,`ref_number` varchar(20)
,`ref_id` int(11)
,`consumer` varchar(202)
,`detail` varchar(18)
,`filed_at` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_worker_assignments`
-- (See below for the actual view)
--
CREATE TABLE `v_worker_assignments` (
`job_type` varchar(15)
,`job_number` varchar(20)
,`job_id` int(11)
,`consumer` varchar(202)
,`detail` varchar(19)
,`location` varchar(202)
,`landmark` varchar(255)
,`status` varchar(11)
,`date_filed` datetime
,`worker_id` int(11)
,`worker_name` varchar(150)
,`team_name` varchar(50)
,`latitude` decimal(10,8)
,`longitude` decimal(11,8)
);

-- --------------------------------------------------------

--
-- Table structure for table `workers`
--

CREATE TABLE `workers` (
  `worker_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `team_name` varchar(50) NOT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('Available','On Job','Off Duty','On Leave') NOT NULL DEFAULT 'Available',
  `hire_date` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workers`
--

INSERT INTO `workers` (`worker_id`, `user_id`, `team_name`, `specialty`, `phone`, `status`, `hire_date`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 6, 'Crew Alpha', 'Line Maintenance', '09271234567', 'Available', NULL, NULL, '2026-02-24 01:09:15', '2026-02-26 06:02:51'),
(2, 7, 'Crew Alpha', 'Meter Installation', '09281234567', 'On Job', NULL, NULL, '2026-02-24 01:09:15', '2026-02-24 01:09:15'),
(3, 8, 'Crew Bravo', 'Transformer Repair', '09291234567', 'Available', NULL, NULL, '2026-02-24 01:09:15', '2026-02-24 01:09:15'),
(4, 9, 'Crew Bravo', 'Line Maintenance', '09301234567', 'Available', NULL, NULL, '2026-02-24 01:09:15', '2026-02-24 01:09:15'),
(6, 14, 'Crew Bravo', 'General Maintenance', '123456789', 'Available', NULL, 1, '2026-02-24 01:29:06', '2026-02-25 06:42:18'),
(9, 26, 'Crew Alpha', 'Reconnection', '12345678901', 'Available', NULL, 1, '2026-03-02 01:34:41', '2026-03-02 01:34:41');

-- --------------------------------------------------------

--
-- Structure for view `v_dashboard_stats`
--
DROP TABLE IF EXISTS `v_dashboard_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_dashboard_stats`  AS SELECT (select count(0) from `members`) AS `total_members`, (select count(0) from `service_requests` where `service_requests`.`status` in ('New','In Progress')) AS `open_srs`, (select count(0) from `reconnection_orders` where `reconnection_orders`.`status` = 'Pending') AS `pending_recons`, (select count(0) from `v_pending_approvals`) AS `awaiting_approval`, (select count(0) from `workers` where `workers`.`status` = 'Available') AS `available_workers` ;

-- --------------------------------------------------------

--
-- Structure for view `v_pending_approvals`
--
DROP TABLE IF EXISTS `v_pending_approvals`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_pending_approvals`  AS SELECT 'Reconnection' AS `type`, `ro`.`ro_number` AS `ref_number`, `ro`.`ro_id` AS `ref_id`, concat(`m`.`last_name`,', ',`m`.`first_name`) AS `consumer`, concat('₱',format(`ro`.`total_amount`,2)) AS `detail`, `ro`.`created_at` AS `filed_at` FROM (`reconnection_orders` `ro` join `members` `m` on(`ro`.`member_id` = `m`.`member_id`)) WHERE `ro`.`status` = 'Pending'union all select 'Meter Change' AS `Meter Change`,`mc`.`mc_number` AS `mc_number`,`mc`.`mc_id` AS `mc_id`,concat(`m`.`last_name`,', ',`m`.`first_name`) AS `CONCAT(m.last_name, ', ', m.first_name)`,`mc`.`reason` AS `reason`,`mc`.`created_at` AS `created_at` from (`meter_change_orders` `mc` join `members` `m` on(`mc`.`member_id` = `m`.`member_id`)) where `mc`.`status` = 'Pending' union all select 'Senior Discount' AS `Senior Discount`,`sc`.`sc_number` AS `sc_number`,`sc`.`sc_id` AS `sc_id`,concat(`m`.`last_name`,', ',`m`.`first_name`) AS `CONCAT(m.last_name, ', ', m.first_name)`,concat('Age ',`sc`.`age`) AS `CONCAT('Age ', sc.age)`,`sc`.`created_at` AS `created_at` from (`senior_citizen_discounts` `sc` join `members` `m` on(`sc`.`member_id` = `m`.`member_id`)) where `sc`.`status` = 'Pending'  ;

-- --------------------------------------------------------

--
-- Structure for view `v_worker_assignments`
--
DROP TABLE IF EXISTS `v_worker_assignments`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_worker_assignments`  AS SELECT 'Service Request' AS `job_type`, `sr`.`sr_number` AS `job_number`, `sr`.`sr_id` AS `job_id`, concat(`m`.`last_name`,', ',`m`.`first_name`) AS `consumer`, `sr`.`nature` AS `detail`, concat_ws(', ',`m`.`address_brgy`,`m`.`address_muni`) AS `location`, `sr`.`landmark` AS `landmark`, `sr`.`status` AS `status`, `sr`.`filed_at` AS `date_filed`, `w`.`worker_id` AS `worker_id`, `u`.`full_name` AS `worker_name`, `w`.`team_name` AS `team_name`, `m`.`latitude` AS `latitude`, `m`.`longitude` AS `longitude` FROM (((`service_requests` `sr` join `members` `m` on(`sr`.`member_id` = `m`.`member_id`)) join `workers` `w` on(`sr`.`assigned_worker_id` = `w`.`worker_id`)) join `users` `u` on(`w`.`user_id` = `u`.`user_id`)) WHERE `sr`.`status` in ('New','In Progress')union all select 'Reconnection' AS `Reconnection`,`ro`.`ro_number` AS `ro_number`,`ro`.`ro_id` AS `ro_id`,concat(`m`.`last_name`,', ',`m`.`first_name`) AS `CONCAT(m.last_name, ', ', m.first_name)`,concat('₱',format(`ro`.`total_amount`,2)) AS `CONCAT('₱', FORMAT(ro.total_amount, 2))`,concat_ws(', ',`m`.`address_brgy`,`m`.`address_muni`) AS `CONCAT_WS(', ', m.address_brgy, m.address_muni)`,`ro`.`landmark` AS `landmark`,`ro`.`status` AS `status`,`ro`.`created_at` AS `created_at`,`w`.`worker_id` AS `worker_id`,`u`.`full_name` AS `full_name`,`w`.`team_name` AS `team_name`,`m`.`latitude` AS `latitude`,`m`.`longitude` AS `longitude` from (((`reconnection_orders` `ro` join `members` `m` on(`ro`.`member_id` = `m`.`member_id`)) join `workers` `w` on(`ro`.`assigned_worker_id` = `w`.`worker_id`)) join `users` `u` on(`w`.`user_id` = `u`.`user_id`)) where `ro`.`status` in ('Pending','Approved')  ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_module` (`module`,`ref_id`),
  ADD KEY `idx_audit_date` (`created_at`);

--
-- Indexes for table `billing_history`
--
ALTER TABLE `billing_history`
  ADD PRIMARY KEY (`billing_id`),
  ADD KEY `idx_billing_member` (`member_id`),
  ADD KEY `idx_billing_status` (`payment_status`),
  ADD KEY `idx_billing_due` (`due_date`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_docs_ref` (`ref_type`,`ref_id`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_login_user` (`username`,`attempted_at`),
  ADD KEY `idx_login_ip` (`ip_address`,`attempted_at`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `account_no` (`account_no`),
  ADD UNIQUE KEY `meter_no` (`meter_no`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `registered_by` (`registered_by`),
  ADD KEY `idx_members_account` (`account_no`),
  ADD KEY `idx_members_meter` (`meter_no`),
  ADD KEY `idx_members_name` (`last_name`,`first_name`),
  ADD KEY `idx_members_status` (`status`),
  ADD KEY `idx_members_location` (`latitude`,`longitude`);

--
-- Indexes for table `meters`
--
ALTER TABLE `meters`
  ADD PRIMARY KEY (`meter_id`),
  ADD KEY `idx_meters_no` (`meter_no`);

--
-- Indexes for table `meter_change_orders`
--
ALTER TABLE `meter_change_orders`
  ADD PRIMARY KEY (`mc_id`),
  ADD UNIQUE KEY `mc_number` (`mc_number`),
  ADD KEY `old_meter_id` (`old_meter_id`),
  ADD KEY `new_meter_id` (`new_meter_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_mc_number` (`mc_number`),
  ADD KEY `idx_mc_member` (`member_id`),
  ADD KEY `idx_mc_status` (`status`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notif_id`),
  ADD KEY `idx_notif_user` (`user_id`,`is_read`);

--
-- Indexes for table `reconnection_orders`
--
ALTER TABLE `reconnection_orders`
  ADD PRIMARY KEY (`ro_id`),
  ADD UNIQUE KEY `ro_number` (`ro_number`),
  ADD KEY `prepared_by` (`prepared_by`),
  ADD KEY `checked_by` (`checked_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `rejected_by` (`rejected_by`),
  ADD KEY `assigned_by` (`assigned_by`),
  ADD KEY `idx_ro_number` (`ro_number`),
  ADD KEY `idx_ro_member` (`member_id`),
  ADD KEY `idx_ro_status` (`status`),
  ADD KEY `idx_ro_worker` (`assigned_worker_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_key` (`role_key`);

--
-- Indexes for table `sc_document_checklist`
--
ALTER TABLE `sc_document_checklist`
  ADD PRIMARY KEY (`checklist_id`),
  ADD UNIQUE KEY `uk_sc_doc` (`sc_id`,`doc_type`);

--
-- Indexes for table `senior_citizen_discounts`
--
ALTER TABLE `senior_citizen_discounts`
  ADD PRIMARY KEY (`sc_id`),
  ADD UNIQUE KEY `sc_number` (`sc_number`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_sc_number` (`sc_number`),
  ADD KEY `idx_sc_member` (`member_id`),
  ADD KEY `idx_sc_status` (`status`);

--
-- Indexes for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD PRIMARY KEY (`sr_id`),
  ADD UNIQUE KEY `sr_number` (`sr_number`),
  ADD KEY `filed_by` (`filed_by`),
  ADD KEY `assigned_by` (`assigned_by`),
  ADD KEY `idx_sr_number` (`sr_number`),
  ADD KEY `idx_sr_member` (`member_id`),
  ADD KEY `idx_sr_status` (`status`),
  ADD KEY `idx_sr_worker` (`assigned_worker_id`),
  ADD KEY `idx_sr_filed` (`filed_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `idx_sessions_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_role` (`role_id`),
  ADD KEY `idx_users_username` (`username`);

--
-- Indexes for table `workers`
--
ALTER TABLE `workers`
  ADD PRIMARY KEY (`worker_id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_workers_status` (`status`),
  ADD KEY `idx_workers_team` (`team_name`),
  ADD KEY `idx_workers_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `log_id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=392;

--
-- AUTO_INCREMENT for table `billing_history`
--
ALTER TABLE `billing_history`
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `meters`
--
ALTER TABLE `meters`
  MODIFY `meter_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `meter_change_orders`
--
ALTER TABLE `meter_change_orders`
  MODIFY `mc_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notif_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reconnection_orders`
--
ALTER TABLE `reconnection_orders`
  MODIFY `ro_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sc_document_checklist`
--
ALTER TABLE `sc_document_checklist`
  MODIFY `checklist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `senior_citizen_discounts`
--
ALTER TABLE `senior_citizen_discounts`
  MODIFY `sc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `service_requests`
--
ALTER TABLE `service_requests`
  MODIFY `sr_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `workers`
--
ALTER TABLE `workers`
  MODIFY `worker_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `billing_history`
--
ALTER TABLE `billing_history`
  ADD CONSTRAINT `billing_history_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`);

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `members_ibfk_2` FOREIGN KEY (`registered_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `meter_change_orders`
--
ALTER TABLE `meter_change_orders`
  ADD CONSTRAINT `meter_change_orders_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  ADD CONSTRAINT `meter_change_orders_ibfk_2` FOREIGN KEY (`old_meter_id`) REFERENCES `meters` (`meter_id`),
  ADD CONSTRAINT `meter_change_orders_ibfk_3` FOREIGN KEY (`new_meter_id`) REFERENCES `meters` (`meter_id`),
  ADD CONSTRAINT `meter_change_orders_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `meter_change_orders_ibfk_5` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `reconnection_orders`
--
ALTER TABLE `reconnection_orders`
  ADD CONSTRAINT `reconnection_orders_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  ADD CONSTRAINT `reconnection_orders_ibfk_2` FOREIGN KEY (`prepared_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reconnection_orders_ibfk_3` FOREIGN KEY (`checked_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reconnection_orders_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reconnection_orders_ibfk_5` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `reconnection_orders_ibfk_6` FOREIGN KEY (`assigned_worker_id`) REFERENCES `workers` (`worker_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reconnection_orders_ibfk_7` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `sc_document_checklist`
--
ALTER TABLE `sc_document_checklist`
  ADD CONSTRAINT `sc_document_checklist_ibfk_1` FOREIGN KEY (`sc_id`) REFERENCES `senior_citizen_discounts` (`sc_id`) ON DELETE CASCADE;

--
-- Constraints for table `senior_citizen_discounts`
--
ALTER TABLE `senior_citizen_discounts`
  ADD CONSTRAINT `senior_citizen_discounts_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  ADD CONSTRAINT `senior_citizen_discounts_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `senior_citizen_discounts_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `service_requests`
--
ALTER TABLE `service_requests`
  ADD CONSTRAINT `service_requests_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  ADD CONSTRAINT `service_requests_ibfk_2` FOREIGN KEY (`filed_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `service_requests_ibfk_3` FOREIGN KEY (`assigned_worker_id`) REFERENCES `workers` (`worker_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `service_requests_ibfk_4` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);

--
-- Constraints for table `workers`
--
ALTER TABLE `workers`
  ADD CONSTRAINT `workers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `workers_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `esamelco_auto_purge` ON SCHEDULE EVERY 1 DAY STARTS '2026-02-27 00:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
                DECLARE cutoff DATE;
                SET cutoff = DATE_SUB(CURDATE(), INTERVAL 1 YEAR);
                
                DELETE FROM service_requests WHERE status IN ('Completed','Declined') AND filed_at < cutoff;
                DELETE FROM reconnection_orders WHERE status = 'Completed' AND created_at < cutoff;
                DELETE FROM audit_log WHERE created_at < cutoff;
                
                INSERT INTO audit_log (user_id, action, details, table_name, created_at)
                VALUES (1, 'PURGE', CONCAT('Auto-purge: deleted records older than ', cutoff), 'system', NOW());
            END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
