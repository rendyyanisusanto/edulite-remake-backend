-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: edulite-remake
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `edulite-remake`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `edulite-remake` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `edulite-remake`;

--
-- Table structure for table `academic_years`
--

DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_years`
--

LOCK TABLES `academic_years` WRITE;
/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
INSERT INTO `academic_years` VALUES (1,'2025/2026 Genap','2026-01-05','2026-06-05',1,'2026-03-12 04:18:26','2026-03-12 04:18:26');
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `achievement_participants`
--

DROP TABLE IF EXISTS `achievement_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievement_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `achievement_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `achievement_id` (`achievement_id`) USING BTREE,
  KEY `student_id` (`student_id`) USING BTREE,
  KEY `teacher_id` (`teacher_id`) USING BTREE,
  CONSTRAINT `achievement_participants_ibfk_1` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `achievement_participants_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `achievement_participants_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievement_participants`
--

LOCK TABLES `achievement_participants` WRITE;
/*!40000 ALTER TABLE `achievement_participants` DISABLE KEYS */;
INSERT INTO `achievement_participants` VALUES (1,1,232,NULL,'Peserta',''),(2,1,208,NULL,'Peserta',''),(3,2,170,NULL,'Peserta',''),(4,3,88,NULL,'Peserta',''),(5,4,170,NULL,'Peserta',''),(6,5,88,NULL,'Peserta',''),(7,6,191,NULL,'Peserta',''),(8,6,137,NULL,'',''),(9,6,173,NULL,'Peserta',''),(10,6,201,NULL,'Peserta',''),(11,7,234,NULL,'Peserta',''),(12,7,232,NULL,'Peserta',''),(13,8,137,NULL,'Peserta',''),(14,8,48,NULL,'Peserta',''),(15,8,9,NULL,'Peserta',''),(16,8,52,NULL,'Peserta',''),(17,8,10,NULL,'Peserta',''),(18,8,30,NULL,'Peserta',''),(19,8,54,NULL,'PESERTA',''),(20,8,144,NULL,'Pembina',''),(21,8,173,NULL,'Pembina',''),(22,8,191,NULL,'Pembina',''),(23,9,87,NULL,'PESERTA',''),(24,10,170,NULL,'Peserta',''),(25,10,202,NULL,'Peserta',''),(26,10,204,NULL,'Peserta',''),(27,10,203,NULL,'Peserta',''),(28,10,201,NULL,'Peserta',''),(29,11,144,NULL,'Peserta',''),(30,11,82,NULL,'Peserta',''),(31,11,143,NULL,'Peserta',''),(32,11,81,NULL,'Peserta',''),(33,11,32,NULL,'Peserta',''),(34,11,113,NULL,'Peserta',''),(35,11,112,NULL,'Peserta',''),(36,11,116,NULL,'Peserta',''),(37,11,126,NULL,'Peserta',''),(38,11,122,NULL,'Peserta',''),(39,12,33,NULL,'Peserta',''),(40,12,25,NULL,'Peserta',''),(41,12,28,NULL,'Peserta',''),(42,13,81,NULL,'Peserta',''),(43,14,204,NULL,'Peserta',''),(44,14,119,NULL,'Peserta',''),(45,15,204,NULL,'Peserta',''),(46,15,175,NULL,'Peserta',''),(47,15,81,NULL,'Peserta',''),(48,16,170,NULL,'Peserta',''),(49,16,88,NULL,'Peserta',''),(50,17,170,NULL,'Peserta',''),(51,17,88,NULL,'Peserta',''),(52,18,25,NULL,'Peserta',''),(53,18,33,NULL,'Peserta',''),(54,18,129,NULL,'Peserta',''),(55,18,132,NULL,'Peserta',''),(56,18,127,NULL,'Peserta',''),(57,18,111,NULL,'Peserta',''),(58,19,33,NULL,'Peserta','');
/*!40000 ALTER TABLE `achievement_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `achievement_point_rules`
--

DROP TABLE IF EXISTS `achievement_point_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievement_point_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rank` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `points` int DEFAULT '0',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievement_point_rules`
--

LOCK TABLES `achievement_point_rules` WRITE;
/*!40000 ALTER TABLE `achievement_point_rules` DISABLE KEYS */;
INSERT INTO `achievement_point_rules` VALUES (1,'Nasional - Pemerintah','Juara 1/2/3','Akademik',50,'Lomba yang diadakan pemerintah seperti LKS','2026-03-12 09:53:45'),(2,'Nasional - Pemerintah','Harapan atau Juara Lain','Akademik',30,'','2026-03-12 09:54:25'),(3,'Nasional - Pemerintah','Peserta','Akademik',20,'','2026-03-12 09:55:40'),(4,'Provinsi - Pemerintah','Juara 1/2/3','Akademik',30,'','2026-03-12 09:56:19'),(5,'Provinsi - Pemerintah','Juara Harapan / Juara Lain','Akademik',20,'','2026-03-12 09:56:48'),(6,'Provinsi - Pemerintah','Peserta','Akademik',15,'','2026-03-12 09:57:12'),(7,'Kabupaten/Kota - Pemerintah','Juara 1/2/3','Akademik',20,'','2026-03-12 09:58:20'),(8,'Kabupaten/Kota - Pemerintah','Juara Harapan / Juara Lain','Akademik',15,'','2026-03-12 09:58:48'),(9,'Kabupaten/Kota - Pemerintah','Peserta','Akademik',10,'','2026-03-12 09:59:09'),(10,'Nasional - Non Pemerintah/Kampus','Juara 1/2/3','Akademik/Olahraga',15,'','2026-03-12 09:59:58'),(11,'Nasional - Non Pemerintah/Kampus','Juara Lain / Harapan','Akademik/Olahraga',10,'','2026-03-12 10:01:51'),(12,'Nasional - Non Pemerintah/Kampus','Peserta','Akademik/Olahraga',5,'','2026-03-12 10:03:16'),(13,'Provinsi - Non Pemerintah / Kampus','Juara 1/2/3','Akademik/Olahraga',10,'','2026-03-12 10:03:54'),(14,'Provinsi - Non Pemerintah / Kampus','Juara Lain / Harapan','Akademik/Olahraga',5,'','2026-03-12 10:04:19'),(15,'Provinsi - Non Pemerintah / Kampus','Peserta','Akademik/Olahraga',3,'','2026-03-12 10:04:54'),(16,'Kabupaten/Kota - Non Pemerintah / Kampus','Juara 1/2/3','Akademik/Olahraga',5,'','2026-03-12 10:05:29'),(17,'Kabupaten/Kota - Non Pemerintah / Kampus','Juara Lain / Harapan','Akademik/Olahraga',3,'','2026-03-12 10:05:53'),(18,'Nasional - Swasta','Juara 1/2/3','Akademik/Olahraga',10,'','2026-03-12 10:06:19'),(19,'Nasional - Swasta','Juara Lain / Harapan','Akademik/Olahraga',5,'','2026-03-12 10:07:18'),(20,'Nasional - Swasta','Peserta','Akademik/Olahraga',3,'','2026-03-12 10:07:47'),(21,'Provinsi - Swasta','Juara 1/2/3','Akademik/Olahraga',5,'','2026-03-12 10:08:06'),(22,'Provinsi - Swasta','Juara Lain / Harapan','Akademik/Olahraga',3,'','2026-03-12 10:08:18'),(23,'Provinsi - Swasta','Peserta','Akademik/Olahraga',2,'','2026-03-12 10:08:31'),(24,'Kabupaten/Kota - Swasta','Juara 1/2/3','Akademik/Olahraga',3,'','2026-03-12 10:08:54'),(25,'Kabupaten/Kota - Swasta','Juara Lain / Harapan','Akademik/Olahraga',2,'','2026-03-12 10:09:08'),(26,'Kabupaten/Kota - Swasta','Peserta','Akademik/Olahraga',1,'','2026-03-12 10:09:20'),(27,'Kabupaten/Kota - Non Pemerintah / Kampus','Peserta','Akademik',1,'','2026-03-12 13:48:51');
/*!40000 ALTER TABLE `achievement_point_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `achievement_results`
--

DROP TABLE IF EXISTS `achievement_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievement_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `participant_id` int NOT NULL,
  `rank` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `score` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `certificate_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `point_rule_id` int DEFAULT NULL,
  `points` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `participant_id` (`participant_id`) USING BTREE,
  KEY `achievement_results_point_rule_id_foreign_idx` (`point_rule_id`) USING BTREE,
  CONSTRAINT `achievement_results_ibfk_1` FOREIGN KEY (`participant_id`) REFERENCES `achievement_participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `achievement_results_point_rule_id_foreign_idx` FOREIGN KEY (`point_rule_id`) REFERENCES `achievement_point_rules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievement_results`
--

LOCK TABLES `achievement_results` WRITE;
/*!40000 ALTER TABLE `achievement_results` DISABLE KEYS */;
INSERT INTO `achievement_results` VALUES (1,2,'Juara Lain / Harapan','80','Akademik/Olahraga','','',11,10),(2,1,'Juara Lain / Harapan','80','Akademik/Olahraga','','',11,10),(3,3,'Juara 1/2/3','80','Akademik','','',7,20),(4,4,'Peserta','70','Akademik','','',9,10),(5,5,'Peserta','80','Akademik','','',6,15),(6,6,'Peserta','80','Akademik/Olahraga','','',12,5),(7,10,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(8,9,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(9,8,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(10,7,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(11,12,'Juara 1/2/3','80','Akademik/Olahraga','','',10,15),(12,11,'Juara Lain / Harapan','80','Akademik/Olahraga','','',11,10),(13,22,'Peserta','80','Akademik/Olahraga','','',20,3),(14,21,'Peserta','80','Akademik/Olahraga','','',20,3),(15,20,'Peserta','80','Akademik/Olahraga','','',20,3),(16,19,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(17,18,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(18,17,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(19,16,'Juara 1/2/3','70','Akademik/Olahraga','','',18,10),(20,15,'Peserta','80','Akademik/Olahraga','','',20,3),(21,14,'Juara 1/2/3','80','Akademik','','',18,10),(22,13,'Juara 1/2/3','80','Akademik/Olahraga','','',18,10),(23,23,'Peserta','80','Akademik','','',3,5),(24,24,'Peserta','70','Akademik/Olahraga','','',12,5),(25,28,'Peserta','80','Akademik/Olahraga','','',12,5),(26,27,'Peserta','80','Akademik/Olahraga','','',12,5),(27,26,'Peserta','80','Akademik/Olahraga','','',12,5),(28,25,'Peserta','80','Akademik/Olahraga','','',12,5),(29,29,'Juara Lain / Harapan','80','Akademik/Olahraga','','',11,10),(30,30,'Juara Lain / Harapan','80','Akademik/Olahraga','','',11,10),(31,31,'Juara 1/2/3','80','Akademik/Olahraga','','',10,15),(32,32,'Peserta','80','Akademik/Olahraga','','',12,5),(33,33,'Peserta','80','Akademik/Olahraga','','',12,5),(34,34,'Peserta','80','Akademik/Olahraga','','',12,5),(35,35,'Peserta','','Akademik/Olahraga','','',12,5),(36,36,'Peserta','','Akademik/Olahraga','','',12,5),(37,37,'Peserta','','Akademik/Olahraga','','',12,5),(38,38,'Peserta','','Akademik/Olahraga','','',12,5),(39,39,'Peserta','70','Akademik/Olahraga','','',15,3),(40,40,'Peserta','','Akademik/Olahraga','','',15,3),(41,41,'Peserta','','Akademik/Olahraga','','',15,3),(42,42,'Peserta','','Akademik/Olahraga','','',3,5),(43,43,'Juara 1/2/3','','Akademik/Olahraga','','',10,10),(44,44,'Juara 1/2/3','','Akademik/Olahraga','','',10,10),(45,45,'Juara Lain / Harapan','','Akademik/Olahraga','','',11,10),(46,46,'Juara Lain / Harapan','','Akademik/Olahraga','','',11,10),(47,47,'Juara 1/2/3','','Akademik/Olahraga','','',11,10),(48,49,'Juara 1/2/3','','Akademik/Olahraga','','',13,15),(49,48,'Juara 1/2/3','','Akademik/Olahraga','','',13,15),(50,50,'Juara 1/2/3','','Akademik','','',7,20),(51,51,'Juara 1/2/3','','Akademik','','',7,20),(52,57,'Peserta','','Akademik','','',27,1),(53,56,'Peserta','','Akademik','','',27,1),(54,55,'Peserta','','Akademik','','',27,1),(55,54,'Peserta','','Akademik','','',27,1),(56,53,'Peserta','','Akademik','','',27,1),(57,52,'Peserta','','Akademik','','',27,1),(58,58,'Peserta','','Akademik/Olahraga','','',26,1);
/*!40000 ALTER TABLE `achievement_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `achievements`
--

DROP TABLE IF EXISTS `achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `organizer` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `event_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `academic_year_id` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `created_by` (`created_by`) USING BTREE,
  KEY `updated_by` (`updated_by`) USING BTREE,
  KEY `achievements_academic_year_id_foreign_idx` (`academic_year_id`) USING BTREE,
  CONSTRAINT `achievements_academic_year_id_foreign_idx` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `achievements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `achievements_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievements`
--

LOCK TABLES `achievements` WRITE;
/*!40000 ALTER TABLE `achievements` DISABLE KEYS */;
INSERT INTO `achievements` VALUES (1,'Volcano Scientific Competition (VOSICO)','Nasional','Universitas Negeri Malang','Malang','Akademik','2025-04-18','',1,1,'2026-03-12 12:33:23','2026-03-12 12:33:23',1),(2,'Lomba Kompetensi Siswa (LKS) bidang IT Software Solution for Business','Kabupaten/Kota','DIKMEN','Malang','Akademik','2025-02-20','',1,1,'2026-03-12 12:44:18','2026-03-12 12:44:18',1),(3,'Lomba Kompetensi Siswa (LKS) bidang IT Network System Administration ','Kabupaten/Kota','DIKMEN','Malang','Akademik','2025-02-20','',1,1,'2026-03-12 12:46:01','2026-03-12 12:46:01',1),(4,'Lomba Kompetensi Siswa (LKS) bidang IT Software Solution for Business Provinsi 2025','Provinsi','DIKMEN','Malang','Akademik','2025-04-23','',1,1,'2026-03-12 12:47:30','2026-03-12 12:47:30',1),(5,'Lomba Mikrotik ','Nasional','PT. CITRAWEB SOLUTION TECHNOLOGY','Malang','Akademik','2025-04-04','',1,1,'2026-03-12 12:49:16','2026-03-12 12:49:16',1),(6,'Kejuaraan pencak silat \"PIALA GARUDEYA\" 2025 ','Nasional','Pondok Pesantren An Nashr Wajak','Wajak','Olahraga','2025-03-04','',1,1,'2026-03-12 12:50:56','2026-03-12 12:50:56',1),(7,'lomba Muslim Youth Creativity Competition 2 2025 ','Nasional','Universitas Islam Malang (UNISMA)','Malang','Akademik','2025-04-20','',1,1,'2026-03-12 12:55:08','2026-03-12 12:55:08',1),(8,'Kejuaraan pencak silat Batu Championship','Nasional','POLTEKAD ','Malang','Seni Budaya','2025-11-05','',1,1,'2026-03-12 12:57:59','2026-03-12 12:57:59',1),(9,'Lomba MTQ PAI FAIR 2025','Nasional','KEMENAG','Malang','Akademik','2025-10-10','',1,1,'2026-03-12 13:06:42','2026-03-12 13:06:42',1),(10,' JYCC','Nasional','UBAYA','Surabaya','Akademik','2025-11-27','',1,1,'2026-03-12 13:08:34','2026-03-12 13:08:34',1),(11,'Kejuaraan Aero Modelling ','Nasional','ARHANUD','Malang','Lainnya','2025-11-11','',1,1,'2026-03-12 13:14:35','2026-03-12 13:14:35',1),(12,'Lomba FLS2N Bidang Desain Poster','Provinsi','PUSPRESNAS','Malang','Akademik','2025-11-11','',1,1,'2026-03-12 13:21:23','2026-03-12 13:21:23',1),(13,'Pelajar Penggerak Merah Putih','Kabupaten/Kota','Dinas','Malang','Akademik','2025-11-29','',1,1,'2026-03-12 13:23:49','2026-03-12 13:23:49',1),(14,'Lomba OSN BAHASA INGGRIS','Nasional','UNISMA','Malang','Akademik','2025-08-23','',1,1,'2026-03-12 13:25:31','2026-03-12 13:26:27',1),(15,'Eduspark English Content Competition','Nasional','UNISMA','Malang','Akademik','2025-11-23','',1,1,'2026-03-12 13:27:46','2026-03-12 13:27:46',1),(16,'Lomba Kompetensi Siswa (LKS) Maarif Tingkat Provinsi','Provinsi','MKKS SMK MAARIF & SMK PONPES JAWA TIMUR','Blitar','Akademik','2025-01-18','',1,1,'2026-03-12 13:30:54','2026-03-12 13:31:53',1),(17,'Lomba Kompetensi Siswa (LKS) DIKMEN 2026','Kabupaten/Kota','DIKMEN','Malang','Akademik','2026-02-03','',1,1,'2026-03-12 13:34:01','2026-03-12 13:34:01',1),(18,'Lomba Desain Poster Infografis Machung','Kabupaten/Kota','Machung','Malang','Akademik','2025-12-01','',1,1,'2026-03-12 13:44:36','2026-03-12 13:44:36',1),(19,'Lomba Poster Dakwah FTI Fest 2025','Kabupaten/Kota','FTI Fest','Malang','Akademik','2025-12-20','',1,1,'2026-03-12 13:47:34','2026-03-12 13:47:34',1);
/*!40000 ALTER TABLE `achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_locations`
--

DROP TABLE IF EXISTS `attendance_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `radius_meters` int NOT NULL DEFAULT '100',
  `location_type` varchar(30) DEFAULT NULL COMMENT 'e.g. SCHOOL, BRANCH, REMOTE',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_locations`
--

LOCK TABLES `attendance_locations` WRITE;
/*!40000 ALTER TABLE `attendance_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_request_logs`
--

DROP TABLE IF EXISTS `attendance_request_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_request_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attendance_request_id` int NOT NULL,
  `action` varchar(30) NOT NULL COMMENT 'SUBMITTED, APPROVED, REJECTED, CANCELLED',
  `action_by` int NOT NULL,
  `action_note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_att_req_log_request` (`attendance_request_id`),
  KEY `idx_att_req_log_actor` (`action_by`),
  CONSTRAINT `attendance_request_logs_ibfk_1` FOREIGN KEY (`attendance_request_id`) REFERENCES `attendance_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `attendance_request_logs_ibfk_2` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_request_logs`
--

LOCK TABLES `attendance_request_logs` WRITE;
/*!40000 ALTER TABLE `attendance_request_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_request_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_requests`
--

DROP TABLE IF EXISTS `attendance_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `attendance_id` int DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `request_type` varchar(30) NOT NULL COMMENT 'CLOCK_IN, CLOCK_OUT, BOTH, CORRECTION',
  `request_status` varchar(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED',
  `requested_clock_in_at` datetime DEFAULT NULL,
  `requested_clock_out_at` datetime DEFAULT NULL,
  `requested_clock_in_note` text,
  `requested_clock_out_note` text,
  `reason` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attendance_id` (`attendance_id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_att_req_user_date` (`user_id`,`attendance_date`),
  KEY `idx_att_req_status` (`request_status`),
  KEY `idx_att_req_type` (`request_type`),
  CONSTRAINT `attendance_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `attendance_requests_ibfk_2` FOREIGN KEY (`attendance_id`) REFERENCES `user_attendances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `attendance_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_requests`
--

LOCK TABLES `attendance_requests` WRITE;
/*!40000 ALTER TABLE `attendance_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_settings`
--

DROP TABLE IF EXISTS `attendance_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL DEFAULT 'Default Setting',
  `center_lat` decimal(10,7) NOT NULL,
  `center_lng` decimal(10,7) NOT NULL,
  `radius_meters` int NOT NULL DEFAULT '100',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `allow_outside_radius` tinyint(1) NOT NULL DEFAULT '0',
  `require_selfie` tinyint(1) NOT NULL DEFAULT '0',
  `require_note_outside_radius` tinyint(1) NOT NULL DEFAULT '1',
  `min_gps_accuracy_meters` decimal(8,2) NOT NULL DEFAULT '100.00',
  `clock_in_tolerance_minutes` int NOT NULL DEFAULT '0',
  `clock_out_tolerance_minutes` int NOT NULL DEFAULT '0',
  `active_shift_id` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `active_shift_id` (`active_shift_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `attendance_settings_ibfk_1` FOREIGN KEY (`active_shift_id`) REFERENCES `attendance_shifts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `attendance_settings_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_settings`
--

LOCK TABLES `attendance_settings` WRITE;
/*!40000 ALTER TABLE `attendance_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_shifts`
--

DROP TABLE IF EXISTS `attendance_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(30) DEFAULT NULL,
  `clock_in_start` time NOT NULL,
  `clock_in_end` time NOT NULL,
  `clock_out_start` time DEFAULT NULL,
  `clock_out_end` time DEFAULT NULL,
  `late_after` time DEFAULT NULL COMMENT 'Time after which clock-in is considered late',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shifts_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_shifts`
--

LOCK TABLES `attendance_shifts` WRITE;
/*!40000 ALTER TABLE `attendance_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_templates`
--

DROP TABLE IF EXISTS `card_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `background_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `orientation` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `layout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_default` tinyint(1) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_templates`
--

LOCK TABLES `card_templates` WRITE;
/*!40000 ALTER TABLE `card_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `card_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grade_id` int NOT NULL,
  `department_id` int DEFAULT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `homeroom_teacher_id` int DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `grade_id` (`grade_id`) USING BTREE,
  KEY `department_id` (`department_id`) USING BTREE,
  KEY `homeroom_teacher_id` (`homeroom_teacher_id`) USING BTREE,
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `classes_ibfk_3` FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,1,'X TKJ',28,NULL,'2026-03-12 04:35:29','2026-03-12 04:35:29'),(2,2,1,'XI TKJ',3,NULL,'2026-03-12 04:36:01','2026-03-12 04:37:13'),(4,3,1,'XII TKJ',24,NULL,'2026-03-12 04:36:27','2026-03-12 04:36:27'),(5,1,2,'X DKV',9,NULL,'2026-03-12 04:37:53','2026-03-12 04:37:53'),(6,2,2,'XI DKV',18,NULL,'2026-03-12 04:38:05','2026-03-12 04:38:05'),(7,3,2,'XII DKV',14,NULL,'2026-03-12 04:38:25','2026-03-12 04:38:25'),(8,1,3,'X APHP',26,NULL,'2026-03-12 04:46:14','2026-03-12 04:46:14'),(9,2,3,'XI APHP',21,NULL,'2026-03-12 04:46:37','2026-03-12 04:46:37'),(10,3,3,'XII APHP',29,NULL,'2026-03-12 04:46:54','2026-03-12 04:46:54'),(11,1,4,'X KEP',9,NULL,'2026-03-12 04:49:07','2026-03-12 04:49:07');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counseling_cases`
--

DROP TABLE IF EXISTS `counseling_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counseling_cases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `source` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `issue_title` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `issue_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `level` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `student_id` (`student_id`) USING BTREE,
  KEY `created_by` (`created_by`) USING BTREE,
  KEY `updated_by` (`updated_by`) USING BTREE,
  CONSTRAINT `counseling_cases_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `counseling_cases_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `counseling_cases_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counseling_cases`
--

LOCK TABLES `counseling_cases` WRITE;
/*!40000 ALTER TABLE `counseling_cases` DISABLE KEYS */;
/*!40000 ALTER TABLE `counseling_cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counseling_sessions`
--

DROP TABLE IF EXISTS `counseling_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counseling_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `session_date` datetime DEFAULT NULL,
  `method` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `next_plan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `case_id` (`case_id`) USING BTREE,
  KEY `counselor_id` (`counselor_id`) USING BTREE,
  CONSTRAINT `counseling_sessions_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `counseling_cases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `counseling_sessions_ibfk_2` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counseling_sessions`
--

LOCK TABLES `counseling_sessions` WRITE;
/*!40000 ALTER TABLE `counseling_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `counseling_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Teknik Komputer dan Jaringan','TKJ','','2026-03-12 04:19:02','2026-03-12 04:19:02'),(2,'Desain Komunikasi Visual','DKV','','2026-03-12 04:19:18','2026-03-12 04:19:18'),(3,'Agribisnis Pengolahan Hasil Pertanian','APHP','','2026-03-12 04:19:32','2026-03-12 04:19:32'),(4,'Keperawatan','KEP','','2026-03-12 04:20:15','2026-03-12 04:20:15');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_settings`
--

DROP TABLE IF EXISTS `document_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_profile_id` int NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `header_image` varchar(255) DEFAULT NULL,
  `footer_image` varchar(255) DEFAULT NULL,
  `signature_image` varchar(255) DEFAULT NULL,
  `stamp_image` varchar(255) DEFAULT NULL,
  `signer_name` varchar(150) DEFAULT NULL,
  `signer_title` varchar(100) DEFAULT NULL,
  `signer_nip` varchar(50) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `letter_number_prefix` varchar(50) DEFAULT NULL,
  `letter_number_format` varchar(150) DEFAULT NULL,
  `default_subject` varchar(150) DEFAULT NULL,
  `default_recipient` varchar(150) DEFAULT NULL,
  `default_cc` text,
  `watermark_text` varchar(150) DEFAULT NULL,
  `watermark_image` varchar(255) DEFAULT NULL,
  `pdf_footer_text` text,
  `show_qr_verification` tinyint(1) NOT NULL DEFAULT '0',
  `verification_base_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_document_settings_school_profile_id` (`school_profile_id`),
  KEY `idx_document_settings_document_type` (`document_type`),
  KEY `idx_document_settings_is_active` (`is_active`),
  KEY `idx_document_settings_school_doc_type` (`school_profile_id`,`document_type`),
  CONSTRAINT `document_settings_ibfk_1` FOREIGN KEY (`school_profile_id`) REFERENCES `school_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_settings`
--

LOCK TABLES `document_settings` WRITE;
/*!40000 ALTER TABLE `document_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `required` tinyint(1) DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_categories`
--

DROP TABLE IF EXISTS `extracurricular_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_extracurricular_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_categories`
--

LOCK TABLES `extracurricular_categories` WRITE;
/*!40000 ALTER TABLE `extracurricular_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_coach_assignments`
--

DROP TABLE IF EXISTS `extracurricular_coach_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_coach_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int NOT NULL,
  `coach_id` int NOT NULL,
  `role` varchar(30) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_extracurricular_coach_assignments_active` (`extracurricular_id`,`coach_id`,`is_active`),
  KEY `coach_id` (`coach_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `extracurricular_coach_assignments_ibfk_1` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coach_assignments_ibfk_2` FOREIGN KEY (`coach_id`) REFERENCES `extracurricular_coaches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coach_assignments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coach_assignments_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_coach_assignments`
--

LOCK TABLES `extracurricular_coach_assignments` WRITE;
/*!40000 ALTER TABLE `extracurricular_coach_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_coach_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_coaches`
--

DROP TABLE IF EXISTS `extracurricular_coaches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_coaches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `teacher_id` int DEFAULT NULL,
  `coach_type` varchar(30) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `expertise` varchar(150) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `extracurricular_coaches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coaches_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coaches_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coaches_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coaches_ibfk_5` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_coaches_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_coaches`
--

LOCK TABLES `extracurricular_coaches` WRITE;
/*!40000 ALTER TABLE `extracurricular_coaches` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_coaches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_members`
--

DROP TABLE IF EXISTS `extracurricular_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int NOT NULL,
  `student_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `registration_id` int DEFAULT NULL,
  `join_date` date NOT NULL,
  `exit_date` date DEFAULT NULL,
  `member_no` varchar(50) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_extracurricular_members_unique` (`extracurricular_id`,`student_id`,`academic_year_id`),
  KEY `student_id` (`student_id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `registration_id` (`registration_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `extracurricular_members_ibfk_1` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_members_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_members_ibfk_3` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_members_ibfk_4` FOREIGN KEY (`registration_id`) REFERENCES `extracurricular_registrations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_members_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_members_ibfk_6` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_members`
--

LOCK TABLES `extracurricular_members` WRITE;
/*!40000 ALTER TABLE `extracurricular_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_progress_aspects`
--

DROP TABLE IF EXISTS `extracurricular_progress_aspects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_progress_aspects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `extracurricular_id` (`extracurricular_id`),
  CONSTRAINT `extracurricular_progress_aspects_ibfk_1` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_progress_aspects`
--

LOCK TABLES `extracurricular_progress_aspects` WRITE;
/*!40000 ALTER TABLE `extracurricular_progress_aspects` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_progress_aspects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_registrations`
--

DROP TABLE IF EXISTS `extracurricular_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int NOT NULL,
  `student_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `registration_date` datetime NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `source` varchar(30) NOT NULL DEFAULT 'MOBILE',
  `notes` text,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_extracurricular_registrations_unique` (`extracurricular_id`,`student_id`,`academic_year_id`),
  KEY `student_id` (`student_id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `approved_by` (`approved_by`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `extracurricular_registrations_ibfk_1` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_registrations_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_registrations_ibfk_3` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_registrations_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_registrations_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_registrations`
--

LOCK TABLES `extracurricular_registrations` WRITE;
/*!40000 ALTER TABLE `extracurricular_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_schedules`
--

DROP TABLE IF EXISTS `extracurricular_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `day_of_week` varchar(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `notes` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `extracurricular_id` (`extracurricular_id`),
  CONSTRAINT `extracurricular_schedules_ibfk_1` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_schedules`
--

LOCK TABLES `extracurricular_schedules` WRITE;
/*!40000 ALTER TABLE `extracurricular_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_sessions`
--

DROP TABLE IF EXISTS `extracurricular_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `schedule_id` int DEFAULT NULL,
  `coach_assignment_id` int DEFAULT NULL,
  `session_title` varchar(150) DEFAULT NULL,
  `meeting_no` int DEFAULT NULL,
  `session_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `actual_start_at` datetime DEFAULT NULL,
  `actual_end_at` datetime DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `material` text,
  `notes` text,
  `coach_attendance_status` varchar(30) DEFAULT NULL,
  `coach_checkin_at` datetime DEFAULT NULL,
  `coach_checkout_at` datetime DEFAULT NULL,
  `coach_note` text,
  `status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `coach_assignment_id` (`coach_assignment_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_extracurricular_sessions_extracurricular_date` (`extracurricular_id`,`session_date`),
  KEY `idx_extracurricular_sessions_status` (`status`),
  CONSTRAINT `extracurricular_sessions_ibfk_1` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_sessions_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_sessions_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `extracurricular_schedules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_sessions_ibfk_4` FOREIGN KEY (`coach_assignment_id`) REFERENCES `extracurricular_coach_assignments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_sessions_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_sessions_ibfk_6` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_sessions`
--

LOCK TABLES `extracurricular_sessions` WRITE;
/*!40000 ALTER TABLE `extracurricular_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_student_attendances`
--

DROP TABLE IF EXISTS `extracurricular_student_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_student_attendances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `extracurricular_member_id` int NOT NULL,
  `student_id` int NOT NULL,
  `attendance_status` varchar(30) NOT NULL,
  `checkin_at` datetime DEFAULT NULL,
  `note` text,
  `marked_by` int NOT NULL,
  `marked_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_extracurricular_student_attendances_unique` (`session_id`,`student_id`),
  KEY `extracurricular_member_id` (`extracurricular_member_id`),
  KEY `student_id` (`student_id`),
  KEY `marked_by` (`marked_by`),
  CONSTRAINT `extracurricular_student_attendances_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `extracurricular_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_attendances_ibfk_2` FOREIGN KEY (`extracurricular_member_id`) REFERENCES `extracurricular_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_attendances_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_attendances_ibfk_4` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_student_attendances`
--

LOCK TABLES `extracurricular_student_attendances` WRITE;
/*!40000 ALTER TABLE `extracurricular_student_attendances` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_student_attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurricular_student_progress`
--

DROP TABLE IF EXISTS `extracurricular_student_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurricular_student_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `extracurricular_id` int NOT NULL,
  `extracurricular_member_id` int NOT NULL,
  `student_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `session_id` int DEFAULT NULL,
  `aspect_id` int DEFAULT NULL,
  `progress_date` date NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `predicate` varchar(30) DEFAULT NULL,
  `level` varchar(30) DEFAULT NULL,
  `note` text,
  `recommendation` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `extracurricular_id` (`extracurricular_id`),
  KEY `extracurricular_member_id` (`extracurricular_member_id`),
  KEY `student_id` (`student_id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `session_id` (`session_id`),
  KEY `aspect_id` (`aspect_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `extracurricular_student_progress_ibfk_1` FOREIGN KEY (`extracurricular_id`) REFERENCES `extracurriculars` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_progress_ibfk_2` FOREIGN KEY (`extracurricular_member_id`) REFERENCES `extracurricular_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_progress_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_progress_ibfk_4` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_progress_ibfk_5` FOREIGN KEY (`session_id`) REFERENCES `extracurricular_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_progress_ibfk_6` FOREIGN KEY (`aspect_id`) REFERENCES `extracurricular_progress_aspects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_progress_ibfk_7` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurricular_student_progress_ibfk_8` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurricular_student_progress`
--

LOCK TABLES `extracurricular_student_progress` WRITE;
/*!40000 ALTER TABLE `extracurricular_student_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurricular_student_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extracurriculars`
--

DROP TABLE IF EXISTS `extracurriculars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extracurriculars` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `academic_year_id` int NOT NULL,
  `code` varchar(30) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `type` varchar(30) NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `max_members` int DEFAULT NULL,
  `min_members` int DEFAULT NULL,
  `registration_start_date` date DEFAULT NULL,
  `registration_end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `category_id` (`category_id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `extracurriculars_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `extracurricular_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `extracurriculars_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurriculars_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `extracurriculars_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extracurriculars`
--

LOCK TABLES `extracurriculars` WRITE;
/*!40000 ALTER TABLE `extracurriculars` DISABLE KEYS */;
/*!40000 ALTER TABLE `extracurriculars` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `level` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (1,'Kelas X',10,'2026-03-12 04:18:36','2026-03-12 04:18:36'),(2,'Kelas XI',11,'2026-03-12 04:18:45','2026-03-12 04:18:45'),(3,'Kelas XII',12,'2026-03-12 04:18:52','2026-03-12 04:18:52');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guestbooks`
--

DROP TABLE IF EXISTS `guestbooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guestbooks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guest_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `guest_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `purpose` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `related_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `visit_date` date DEFAULT NULL,
  `checkin_time` datetime DEFAULT NULL,
  `checkout_time` datetime DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_by` int DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `created_by` (`created_by`) USING BTREE,
  KEY `updated_by` (`updated_by`) USING BTREE,
  CONSTRAINT `guestbooks_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `guestbooks_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guestbooks`
--

LOCK TABLES `guestbooks` WRITE;
/*!40000 ALTER TABLE `guestbooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `guestbooks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_groups`
--

DROP TABLE IF EXISTS `menu_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_groups`
--

LOCK TABLES `menu_groups` WRITE;
/*!40000 ALTER TABLE `menu_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_permissions`
--

DROP TABLE IF EXISTS `menu_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `menu_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `menu_id` (`menu_id`) USING BTREE,
  KEY `permission_id` (`permission_id`) USING BTREE,
  CONSTRAINT `menu_permissions_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `menu_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_permissions`
--

LOCK TABLES `menu_permissions` WRITE;
/*!40000 ALTER TABLE `menu_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus`
--

DROP TABLE IF EXISTS `menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `route` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `permission_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `group_id` (`group_id`) USING BTREE,
  KEY `parent_id` (`parent_id`) USING BTREE,
  CONSTRAINT `menus_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `menu_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `menus_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `menus` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus`
--

LOCK TABLES `menus` WRITE;
/*!40000 ALTER TABLE `menus` DISABLE KEYS */;
/*!40000 ALTER TABLE `menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parent_documents`
--

DROP TABLE IF EXISTS `parent_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int NOT NULL,
  `document_type` varchar(30) DEFAULT NULL,
  `document_file` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `parent_documents_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `parent_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_documents`
--

LOCK TABLES `parent_documents` WRITE;
/*!40000 ALTER TABLE `parent_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `parent_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parent_profiles`
--

DROP TABLE IF EXISTS `parent_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nik` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `occupation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `education` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_guardian` tinyint(1) DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `student_id` (`student_id`) USING BTREE,
  CONSTRAINT `parent_profiles_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_profiles`
--

LOCK TABLES `parent_profiles` WRITE;
/*!40000 ALTER TABLE `parent_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `parent_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_letter_students`
--

DROP TABLE IF EXISTS `permission_letter_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_letter_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_letter_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_permission_letter_student` (`permission_letter_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `permission_letter_students_ibfk_1` FOREIGN KEY (`permission_letter_id`) REFERENCES `permission_letters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `permission_letter_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_letter_students`
--

LOCK TABLES `permission_letter_students` WRITE;
/*!40000 ALTER TABLE `permission_letter_students` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission_letter_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_letters`
--

DROP TABLE IF EXISTS `permission_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_letters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) DEFAULT NULL,
  `activity_name` varchar(150) DEFAULT NULL,
  `purpose` text,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `companion_name` varchar(150) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'DRAFT',
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `teacher_id` (`teacher_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `permission_letters_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permission_letters_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permission_letters_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permission_letters_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_letters`
--

LOCK TABLES `permission_letters` WRITE;
/*!40000 ALTER TABLE `permission_letters` DISABLE KEYS */;
/*!40000 ALTER TABLE `permission_letters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `code` (`code`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'users.view','View Users','Can view users','2026-03-11 05:49:56'),(2,'users.create','Create Users','Can create users','2026-03-11 05:49:56'),(3,'users.update','Update Users','Can update users','2026-03-11 05:49:56'),(4,'users.delete','Delete Users','Can delete users','2026-03-11 05:49:56'),(5,'students.view','View Students','Can view students','2026-03-11 05:49:56'),(6,'students.create','Create Students','Can create students','2026-03-11 05:49:56'),(7,'students.update','Update Students','Can update students','2026-03-11 05:49:56'),(8,'students.delete','Delete Students','Can delete students','2026-03-11 05:49:56');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `positive_point_types`
--

DROP TABLE IF EXISTS `positive_point_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `positive_point_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `points` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `positive_point_types`
--

LOCK TABLES `positive_point_types` WRITE;
/*!40000 ALTER TABLE `positive_point_types` DISABLE KEYS */;
INSERT INTO `positive_point_types` VALUES (1,'Partisipasi Organisasi & Kepemimpinan','sosial',5,'','2026-03-13 03:15:06'),(2,'Kontribusi terhadap Program Sekolah','lainnya',5,'','2026-03-13 03:15:26'),(3,'Karakter & Keteladanan','sosial',5,'','2026-03-13 03:15:54'),(4,'Kepedulian Sosial & Lingkungan','sosial',5,'','2026-03-13 03:16:08'),(5,'Kedisiplinan Positif','akademik',5,'','2026-03-13 03:16:31');
/*!40000 ALTER TABLE `positive_point_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `role_id` (`role_id`) USING BTREE,
  KEY `permission_id` (`permission_id`) USING BTREE,
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SUPERADMIN','System Administrator with full access'),(2,'ADMIN','School Administrator'),(3,'GURU','Teacher'),(4,'SISWA','Student'),(5,'ORTU','Parent / Guardian');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `school_profiles`
--

DROP TABLE IF EXISTS `school_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `short_name` varchar(100) DEFAULT NULL,
  `npsn` varchar(30) DEFAULT NULL,
  `nss` varchar(30) DEFAULT NULL,
  `level` varchar(30) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `foundation_name` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(150) DEFAULT NULL,
  `address` text,
  `village` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `logo_light` varchar(255) DEFAULT NULL,
  `logo_dark` varchar(255) DEFAULT NULL,
  `favicon` varchar(255) DEFAULT NULL,
  `school_icon` varchar(255) DEFAULT NULL,
  `principal_name` varchar(150) DEFAULT NULL,
  `principal_title` varchar(100) DEFAULT NULL,
  `principal_nip` varchar(50) DEFAULT NULL,
  `acting_principal_name` varchar(150) DEFAULT NULL,
  `acting_principal_title` varchar(100) DEFAULT NULL,
  `acting_principal_nip` varchar(50) DEFAULT NULL,
  `description` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school_profiles`
--

LOCK TABLES `school_profiles` WRITE;
/*!40000 ALTER TABLE `school_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `school_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`) USING BTREE,
  UNIQUE KEY `name` (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizemeta`
--

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
INSERT INTO `sequelizemeta` VALUES ('20260310000001-create-users.js'),('20260310000002-create-roles.js'),('20260310000003-create-permissions.js'),('20260310000004-create-sessions.js'),('20260310000005-create-menus.js'),('20260310000006-create-students.js'),('20260310000007-create-student-related.js'),('20260310000008-create-academic.js'),('20260310000009-create-achievements.js'),('20260310000010-create-guestbooks.js'),('20260310000011-create-violations.js'),('20260310000012-create-counseling.js'),('20260311100000-update-achievements.js'),('20260312000001-create-positive-points.js');
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `access_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `refresh_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_attendance_corrections`
--

DROP TABLE IF EXISTS `student_attendance_corrections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance_corrections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_attendance_id` int NOT NULL,
  `student_id` int NOT NULL,
  `request_type` varchar(30) NOT NULL,
  `requested_clock_in_at` datetime DEFAULT NULL,
  `requested_clock_out_at` datetime DEFAULT NULL,
  `reason` text NOT NULL,
  `attachment_file` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_student_attendance_corrections_student_status` (`student_id`,`status`),
  KEY `idx_student_attendance_corrections_attendance_id` (`student_attendance_id`),
  CONSTRAINT `student_attendance_corrections_ibfk_1` FOREIGN KEY (`student_attendance_id`) REFERENCES `student_daily_attendances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_corrections_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_corrections_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance_corrections`
--

LOCK TABLES `student_attendance_corrections` WRITE;
/*!40000 ALTER TABLE `student_attendance_corrections` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_attendance_corrections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_attendance_scan_logs`
--

DROP TABLE IF EXISTS `student_attendance_scan_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance_scan_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `attendance_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `scanned_rfid_code` varchar(100) NOT NULL,
  `scanned_at` datetime NOT NULL,
  `scan_type` varchar(20) DEFAULT NULL,
  `result_status` varchar(30) NOT NULL,
  `result_message` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attendance_id` (`attendance_id`),
  KEY `shift_id` (`shift_id`),
  KEY `idx_student_attendance_scan_logs_scanned_at` (`scanned_at`),
  KEY `idx_student_attendance_scan_logs_student_scanned_at` (`student_id`,`scanned_at`),
  KEY `idx_student_attendance_scan_logs_result_status` (`result_status`),
  CONSTRAINT `student_attendance_scan_logs_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_scan_logs_ibfk_2` FOREIGN KEY (`attendance_id`) REFERENCES `student_daily_attendances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_scan_logs_ibfk_3` FOREIGN KEY (`shift_id`) REFERENCES `student_attendance_shifts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance_scan_logs`
--

LOCK TABLES `student_attendance_scan_logs` WRITE;
/*!40000 ALTER TABLE `student_attendance_scan_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_attendance_scan_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_attendance_shift_classes`
--

DROP TABLE IF EXISTS `student_attendance_shift_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance_shift_classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_year_id` int NOT NULL,
  `class_id` int NOT NULL,
  `shift_id` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_student_attendance_shift_classes_academic_class` (`academic_year_id`,`class_id`),
  KEY `class_id` (`class_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_student_attendance_shift_classes_shift` (`shift_id`),
  CONSTRAINT `student_attendance_shift_classes_ibfk_1` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_shift_classes_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_shift_classes_ibfk_3` FOREIGN KEY (`shift_id`) REFERENCES `student_attendance_shifts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_shift_classes_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance_shift_classes`
--

LOCK TABLES `student_attendance_shift_classes` WRITE;
/*!40000 ALTER TABLE `student_attendance_shift_classes` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_attendance_shift_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_attendance_shift_students`
--

DROP TABLE IF EXISTS `student_attendance_shift_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance_shift_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_year_id` int NOT NULL,
  `student_id` int NOT NULL,
  `shift_id` int NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_student_attendance_shift_students_academic_student` (`academic_year_id`,`student_id`),
  KEY `student_id` (`student_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_student_attendance_shift_students_shift` (`shift_id`),
  KEY `idx_student_attendance_shift_students_period` (`start_date`,`end_date`),
  CONSTRAINT `student_attendance_shift_students_ibfk_1` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_shift_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_shift_students_ibfk_3` FOREIGN KEY (`shift_id`) REFERENCES `student_attendance_shifts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_shift_students_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance_shift_students`
--

LOCK TABLES `student_attendance_shift_students` WRITE;
/*!40000 ALTER TABLE `student_attendance_shift_students` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_attendance_shift_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_attendance_shifts`
--

DROP TABLE IF EXISTS `student_attendance_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance_shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `academic_year_id` int DEFAULT NULL,
  `clock_in_start` time NOT NULL,
  `late_after` time NOT NULL,
  `clock_in_end` time NOT NULL,
  `clock_out_start` time DEFAULT NULL,
  `clock_out_end` time DEFAULT NULL,
  `allow_checkout` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text,
  `updated_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_student_attendance_shifts_academic_year` (`academic_year_id`),
  KEY `idx_student_attendance_shifts_is_active` (`is_active`),
  CONSTRAINT `student_attendance_shifts_ibfk_1` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_attendance_shifts_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_attendance_shifts`
--

LOCK TABLES `student_attendance_shifts` WRITE;
/*!40000 ALTER TABLE `student_attendance_shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_attendance_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_class_history`
--

DROP TABLE IF EXISTS `student_class_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_class_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `grade_id` int NOT NULL,
  `class_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `assignment_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `student_id` (`student_id`) USING BTREE,
  KEY `academic_year_id` (`academic_year_id`) USING BTREE,
  KEY `grade_id` (`grade_id`) USING BTREE,
  KEY `class_id` (`class_id`) USING BTREE,
  KEY `assigned_by` (`assigned_by`) USING BTREE,
  CONSTRAINT `student_class_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_class_history_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_class_history_ibfk_3` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_class_history_ibfk_4` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_class_history_ibfk_5` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=239 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_class_history`
--

LOCK TABLES `student_class_history` WRITE;
/*!40000 ALTER TABLE `student_class_history` DISABLE KEYS */;
INSERT INTO `student_class_history` VALUES (1,1,1,1,1,1,'MANUAL','2026-03-12 04:52:14'),(2,2,1,1,1,1,'MANUAL','2026-03-12 04:52:14'),(3,3,1,1,1,1,'MANUAL','2026-03-12 04:52:14'),(4,4,1,1,1,1,'MANUAL','2026-03-12 04:52:15'),(5,5,1,1,1,1,'MANUAL','2026-03-12 04:52:15'),(6,6,1,1,1,1,'MANUAL','2026-03-12 04:52:15'),(7,7,1,1,1,1,'MANUAL','2026-03-12 04:52:15'),(8,8,1,1,1,1,'MANUAL','2026-03-12 04:52:16'),(9,9,1,1,1,1,'MANUAL','2026-03-12 04:52:16'),(10,10,1,1,1,1,'MANUAL','2026-03-12 04:52:16'),(11,11,1,1,1,1,'MANUAL','2026-03-12 04:52:16'),(12,12,1,1,1,1,'MANUAL','2026-03-12 04:52:16'),(13,13,1,1,1,1,'MANUAL','2026-03-12 04:52:16'),(14,14,1,1,1,1,'MANUAL','2026-03-12 04:52:17'),(15,15,1,1,1,1,'MANUAL','2026-03-12 04:52:17'),(16,16,1,1,1,1,'MANUAL','2026-03-12 04:52:17'),(17,17,1,1,1,1,'MANUAL','2026-03-12 04:52:17'),(18,18,1,1,1,1,'MANUAL','2026-03-12 04:52:17'),(19,19,1,1,1,1,'MANUAL','2026-03-12 04:52:18'),(20,20,1,1,1,1,'MANUAL','2026-03-12 04:52:18'),(21,21,1,1,1,1,'MANUAL','2026-03-12 04:52:19'),(22,22,1,1,1,1,'MANUAL','2026-03-12 04:52:19'),(23,23,1,1,1,1,'MANUAL','2026-03-12 04:52:20'),(24,24,1,1,5,1,'MANUAL','2026-03-12 04:57:29'),(25,25,1,1,5,1,'MANUAL','2026-03-12 04:57:29'),(26,26,1,1,5,1,'MANUAL','2026-03-12 04:57:29'),(27,27,1,1,5,1,'MANUAL','2026-03-12 04:57:29'),(28,28,1,1,5,1,'MANUAL','2026-03-12 04:57:29'),(29,29,1,1,5,1,'MANUAL','2026-03-12 04:57:29'),(30,30,1,1,5,1,'MANUAL','2026-03-12 04:57:30'),(31,31,1,1,5,1,'MANUAL','2026-03-12 04:57:30'),(32,32,1,1,5,1,'MANUAL','2026-03-12 04:57:30'),(33,33,1,1,5,1,'MANUAL','2026-03-12 04:57:31'),(34,34,1,1,5,1,'MANUAL','2026-03-12 04:57:31'),(35,35,1,1,5,1,'MANUAL','2026-03-12 04:57:31'),(36,36,1,1,5,1,'MANUAL','2026-03-12 04:57:31'),(37,37,1,1,5,1,'MANUAL','2026-03-12 04:57:31'),(38,38,1,1,5,1,'MANUAL','2026-03-12 04:57:32'),(39,39,1,1,5,1,'MANUAL','2026-03-12 04:57:32'),(40,40,1,1,5,1,'MANUAL','2026-03-12 04:57:32'),(41,41,1,1,5,1,'MANUAL','2026-03-12 04:57:32'),(42,42,1,1,5,1,'MANUAL','2026-03-12 04:57:33'),(43,43,1,1,5,1,'MANUAL','2026-03-12 04:57:33'),(44,44,1,1,5,1,'MANUAL','2026-03-12 04:57:33'),(45,45,1,1,5,1,'MANUAL','2026-03-12 04:57:33'),(46,46,1,1,8,1,'MANUAL','2026-03-12 04:59:01'),(47,47,1,1,8,1,'MANUAL','2026-03-12 04:59:01'),(48,48,1,1,8,1,'MANUAL','2026-03-12 04:59:01'),(49,49,1,1,8,1,'MANUAL','2026-03-12 04:59:01'),(50,50,1,1,8,1,'MANUAL','2026-03-12 04:59:01'),(51,51,1,1,8,1,'MANUAL','2026-03-12 04:59:02'),(52,52,1,1,8,1,'MANUAL','2026-03-12 04:59:02'),(53,53,1,1,8,1,'MANUAL','2026-03-12 04:59:02'),(54,54,1,1,8,1,'MANUAL','2026-03-12 04:59:02'),(55,55,1,1,8,1,'MANUAL','2026-03-12 04:59:02'),(56,56,1,1,8,1,'MANUAL','2026-03-12 04:59:02'),(57,57,1,1,8,1,'MANUAL','2026-03-12 04:59:02'),(58,58,1,1,8,1,'MANUAL','2026-03-12 04:59:03'),(59,59,1,1,8,1,'MANUAL','2026-03-12 04:59:03'),(60,60,1,1,8,1,'MANUAL','2026-03-12 04:59:03'),(61,61,1,1,8,1,'MANUAL','2026-03-12 04:59:03'),(62,62,1,1,8,1,'MANUAL','2026-03-12 04:59:03'),(63,63,1,1,8,1,'MANUAL','2026-03-12 04:59:03'),(64,64,1,1,8,1,'MANUAL','2026-03-12 04:59:03'),(65,65,1,1,8,1,'MANUAL','2026-03-12 04:59:04'),(66,66,1,1,8,1,'MANUAL','2026-03-12 04:59:04'),(67,67,1,1,8,1,'MANUAL','2026-03-12 04:59:04'),(68,68,1,1,11,1,'MANUAL','2026-03-12 05:00:14'),(69,69,1,1,11,1,'MANUAL','2026-03-12 05:00:15'),(70,70,1,1,11,1,'MANUAL','2026-03-12 05:00:15'),(71,71,1,1,11,1,'MANUAL','2026-03-12 05:00:15'),(72,72,1,1,11,1,'MANUAL','2026-03-12 05:00:15'),(73,73,1,1,11,1,'MANUAL','2026-03-12 05:00:16'),(74,74,1,1,11,1,'MANUAL','2026-03-12 05:00:16'),(75,75,1,1,11,1,'MANUAL','2026-03-12 05:00:16'),(76,76,1,2,2,1,'MANUAL','2026-03-12 05:02:55'),(77,77,1,2,2,1,'MANUAL','2026-03-12 05:02:55'),(78,78,1,2,2,1,'MANUAL','2026-03-12 05:02:55'),(79,79,1,2,2,1,'MANUAL','2026-03-12 05:02:56'),(80,80,1,2,2,1,'MANUAL','2026-03-12 05:02:56'),(81,81,1,2,2,1,'MANUAL','2026-03-12 05:02:56'),(82,82,1,2,2,1,'MANUAL','2026-03-12 05:02:56'),(83,83,1,2,2,1,'MANUAL','2026-03-12 05:02:57'),(84,84,1,2,2,1,'MANUAL','2026-03-12 05:02:57'),(85,85,1,2,2,1,'MANUAL','2026-03-12 05:02:57'),(86,86,1,2,2,1,'MANUAL','2026-03-12 05:02:57'),(87,87,1,2,2,1,'MANUAL','2026-03-12 05:02:58'),(88,88,1,2,2,1,'MANUAL','2026-03-12 05:02:58'),(89,89,1,2,2,1,'MANUAL','2026-03-12 05:02:58'),(90,90,1,2,2,1,'MANUAL','2026-03-12 05:02:59'),(91,91,1,2,2,1,'MANUAL','2026-03-12 05:02:59'),(92,92,1,2,2,1,'MANUAL','2026-03-12 05:02:59'),(93,93,1,2,2,1,'MANUAL','2026-03-12 05:03:00'),(94,94,1,2,2,1,'MANUAL','2026-03-12 05:03:00'),(95,95,1,2,2,1,'MANUAL','2026-03-12 05:03:00'),(96,96,1,2,2,1,'MANUAL','2026-03-12 05:03:01'),(97,97,1,2,2,1,'MANUAL','2026-03-12 05:03:01'),(98,98,1,2,2,1,'MANUAL','2026-03-12 05:03:01'),(99,99,1,2,2,1,'MANUAL','2026-03-12 05:03:02'),(100,100,1,2,2,1,'MANUAL','2026-03-12 05:03:02'),(101,101,1,2,2,1,'MANUAL','2026-03-12 05:03:02'),(102,102,1,2,2,1,'MANUAL','2026-03-12 05:03:03'),(103,103,1,2,2,1,'MANUAL','2026-03-12 05:03:03'),(104,104,1,2,2,1,'MANUAL','2026-03-12 05:03:03'),(105,105,1,2,2,1,'MANUAL','2026-03-12 05:03:04'),(106,106,1,2,2,1,'MANUAL','2026-03-12 05:03:04'),(107,107,1,2,2,1,'MANUAL','2026-03-12 05:03:04'),(108,108,1,2,2,1,'MANUAL','2026-03-12 05:03:05'),(109,109,1,2,2,1,'MANUAL','2026-03-12 05:03:05'),(110,110,1,2,2,1,'MANUAL','2026-03-12 05:03:05'),(111,111,1,2,2,1,'MANUAL','2026-03-12 05:03:05'),(112,112,1,2,6,1,'MANUAL','2026-03-12 05:04:28'),(113,113,1,2,6,1,'MANUAL','2026-03-12 05:04:28'),(114,114,1,2,6,1,'MANUAL','2026-03-12 05:04:29'),(115,115,1,2,6,1,'MANUAL','2026-03-12 05:04:29'),(116,116,1,2,6,1,'MANUAL','2026-03-12 05:04:29'),(117,117,1,2,6,1,'MANUAL','2026-03-12 05:04:29'),(118,118,1,2,6,1,'MANUAL','2026-03-12 05:04:30'),(119,119,1,2,6,1,'MANUAL','2026-03-12 05:04:30'),(120,120,1,2,6,1,'MANUAL','2026-03-12 05:04:30'),(121,121,1,2,6,1,'MANUAL','2026-03-12 05:04:30'),(122,122,1,2,6,1,'MANUAL','2026-03-12 05:04:31'),(123,123,1,2,6,1,'MANUAL','2026-03-12 05:04:31'),(124,124,1,2,6,1,'MANUAL','2026-03-12 05:04:31'),(125,125,1,2,6,1,'MANUAL','2026-03-12 05:04:32'),(126,126,1,2,6,1,'MANUAL','2026-03-12 05:04:32'),(127,127,1,2,6,1,'MANUAL','2026-03-12 05:04:34'),(128,128,1,2,6,1,'MANUAL','2026-03-12 05:04:35'),(129,129,1,2,6,1,'MANUAL','2026-03-12 05:04:35'),(130,130,1,2,6,1,'MANUAL','2026-03-12 05:04:36'),(131,131,1,2,6,1,'MANUAL','2026-03-12 05:04:36'),(132,132,1,2,6,1,'MANUAL','2026-03-12 05:04:37'),(133,133,1,2,6,1,'MANUAL','2026-03-12 05:04:38'),(134,134,1,2,9,1,'MANUAL','2026-03-12 05:05:45'),(135,135,1,2,9,1,'MANUAL','2026-03-12 05:05:45'),(136,136,1,2,9,1,'MANUAL','2026-03-12 05:05:45'),(137,137,1,2,9,1,'MANUAL','2026-03-12 05:05:46'),(138,138,1,2,9,1,'MANUAL','2026-03-12 05:05:47'),(139,139,1,2,9,1,'MANUAL','2026-03-12 05:05:47'),(140,140,1,2,9,1,'MANUAL','2026-03-12 05:05:48'),(141,141,1,2,9,1,'MANUAL','2026-03-12 05:05:48'),(142,142,1,2,9,1,'MANUAL','2026-03-12 05:05:49'),(143,143,1,2,9,1,'MANUAL','2026-03-12 05:05:49'),(144,144,1,2,9,1,'MANUAL','2026-03-12 05:05:50'),(145,145,1,2,9,1,'MANUAL','2026-03-12 05:05:50'),(146,146,1,2,9,1,'MANUAL','2026-03-12 05:05:50'),(147,147,1,2,9,1,'MANUAL','2026-03-12 05:05:51'),(148,148,1,2,9,1,'MANUAL','2026-03-12 05:05:51'),(149,149,1,2,9,1,'MANUAL','2026-03-12 05:05:52'),(150,150,1,2,9,1,'MANUAL','2026-03-12 05:05:52'),(151,151,1,2,9,1,'MANUAL','2026-03-12 05:05:53'),(152,152,1,2,9,1,'MANUAL','2026-03-12 05:05:53'),(153,153,1,2,9,1,'MANUAL','2026-03-12 05:05:54'),(154,154,1,2,9,1,'MANUAL','2026-03-12 05:05:54'),(155,155,1,2,9,1,'MANUAL','2026-03-12 05:05:54'),(156,156,1,2,9,1,'MANUAL','2026-03-12 05:05:55'),(157,157,1,2,9,1,'MANUAL','2026-03-12 05:05:55'),(158,158,1,2,9,1,'MANUAL','2026-03-12 05:05:55'),(159,159,1,2,9,1,'MANUAL','2026-03-12 05:05:56'),(160,160,1,2,9,1,'MANUAL','2026-03-12 05:05:56'),(161,161,1,2,9,1,'MANUAL','2026-03-12 05:05:57'),(162,162,1,2,9,1,'MANUAL','2026-03-12 05:05:57'),(163,163,1,2,9,1,'MANUAL','2026-03-12 05:05:57'),(164,164,1,2,9,1,'MANUAL','2026-03-12 05:05:58'),(166,165,1,3,4,1,'MANUAL','2026-03-12 05:07:51'),(167,166,1,3,4,1,'MANUAL','2026-03-12 05:07:52'),(168,167,1,3,4,1,'MANUAL','2026-03-12 05:07:52'),(169,168,1,3,4,1,'MANUAL','2026-03-12 05:07:52'),(170,169,1,3,4,1,'MANUAL','2026-03-12 05:07:53'),(171,170,1,3,4,1,'MANUAL','2026-03-12 05:07:53'),(172,171,1,3,4,1,'MANUAL','2026-03-12 05:07:53'),(173,172,1,3,4,1,'MANUAL','2026-03-12 05:07:53'),(174,173,1,3,4,1,'MANUAL','2026-03-12 05:07:54'),(175,174,1,3,4,1,'MANUAL','2026-03-12 05:07:54'),(176,175,1,3,4,1,'MANUAL','2026-03-12 05:07:55'),(177,176,1,3,4,1,'MANUAL','2026-03-12 05:07:55'),(178,177,1,3,4,1,'MANUAL','2026-03-12 05:07:56'),(179,178,1,3,4,1,'MANUAL','2026-03-12 05:07:56'),(180,179,1,3,4,1,'MANUAL','2026-03-12 05:07:56'),(181,180,1,3,4,1,'MANUAL','2026-03-12 05:07:57'),(182,181,1,3,4,1,'MANUAL','2026-03-12 05:07:57'),(183,182,1,3,4,1,'MANUAL','2026-03-12 05:07:58'),(184,183,1,3,4,1,'MANUAL','2026-03-12 05:07:58'),(185,184,1,3,4,1,'MANUAL','2026-03-12 05:07:58'),(186,185,1,3,4,1,'MANUAL','2026-03-12 05:07:59'),(187,186,1,3,4,1,'MANUAL','2026-03-12 05:07:59'),(188,187,1,3,4,1,'MANUAL','2026-03-12 05:08:00'),(189,188,1,3,4,1,'MANUAL','2026-03-12 05:08:00'),(190,189,1,3,4,1,'MANUAL','2026-03-12 05:08:00'),(191,190,1,3,4,1,'MANUAL','2026-03-12 05:08:01'),(192,191,1,3,4,1,'MANUAL','2026-03-12 05:08:01'),(193,192,1,3,7,1,'MANUAL','2026-03-12 05:10:16'),(194,193,1,3,7,1,'MANUAL','2026-03-12 05:10:16'),(195,194,1,3,7,1,'MANUAL','2026-03-12 05:10:16'),(196,195,1,3,7,1,'MANUAL','2026-03-12 05:10:16'),(197,196,1,3,7,1,'MANUAL','2026-03-12 05:10:16'),(198,197,1,3,7,1,'MANUAL','2026-03-12 05:10:16'),(199,198,1,3,7,1,'MANUAL','2026-03-12 05:10:17'),(200,199,1,3,7,1,'MANUAL','2026-03-12 05:10:17'),(201,200,1,3,7,1,'MANUAL','2026-03-12 05:10:17'),(202,201,1,3,7,1,'MANUAL','2026-03-12 05:10:17'),(203,202,1,3,7,1,'MANUAL','2026-03-12 05:10:17'),(204,203,1,3,7,1,'MANUAL','2026-03-12 05:10:18'),(205,204,1,3,7,1,'MANUAL','2026-03-12 05:10:18'),(206,205,1,3,7,1,'MANUAL','2026-03-12 05:10:18'),(207,206,1,3,7,1,'MANUAL','2026-03-12 05:10:18'),(208,207,1,3,7,1,'MANUAL','2026-03-12 05:10:18'),(209,208,1,3,7,1,'MANUAL','2026-03-12 05:10:18'),(210,209,1,3,7,1,'MANUAL','2026-03-12 05:10:19'),(211,210,1,3,7,1,'MANUAL','2026-03-12 05:10:19'),(212,211,1,3,7,1,'MANUAL','2026-03-12 05:10:19'),(213,212,1,3,7,1,'MANUAL','2026-03-12 05:10:19'),(214,213,1,3,7,1,'MANUAL','2026-03-12 05:10:20'),(215,214,1,3,7,1,'MANUAL','2026-03-12 05:10:20'),(216,215,1,3,7,1,'MANUAL','2026-03-12 05:10:20'),(217,216,1,3,7,1,'MANUAL','2026-03-12 05:10:20'),(218,217,1,3,7,1,'MANUAL','2026-03-12 05:10:20'),(219,218,1,3,7,1,'MANUAL','2026-03-12 05:10:20'),(220,219,1,3,7,1,'MANUAL','2026-03-12 05:10:21'),(221,220,1,3,10,1,'MANUAL','2026-03-12 05:11:17'),(222,221,1,3,10,1,'MANUAL','2026-03-12 05:11:18'),(223,222,1,3,10,1,'MANUAL','2026-03-12 05:11:18'),(224,223,1,3,10,1,'MANUAL','2026-03-12 05:11:18'),(225,224,1,3,10,1,'MANUAL','2026-03-12 05:11:18'),(226,225,1,3,10,1,'MANUAL','2026-03-12 05:11:18'),(227,226,1,3,10,1,'MANUAL','2026-03-12 05:11:19'),(228,227,1,3,10,1,'MANUAL','2026-03-12 05:11:19'),(229,228,1,3,10,1,'MANUAL','2026-03-12 05:11:19'),(230,229,1,3,10,1,'MANUAL','2026-03-12 05:11:19'),(231,230,1,3,10,1,'MANUAL','2026-03-12 05:11:19'),(232,231,1,3,10,1,'MANUAL','2026-03-12 05:11:20'),(233,232,1,3,10,1,'MANUAL','2026-03-12 05:11:20'),(234,233,1,3,10,1,'MANUAL','2026-03-12 05:11:20'),(235,234,1,3,10,1,'MANUAL','2026-03-12 05:11:20'),(236,235,1,3,10,1,'MANUAL','2026-03-12 05:11:20'),(237,236,1,3,10,1,'MANUAL','2026-03-12 05:11:21'),(238,237,1,3,10,1,'MANUAL','2026-03-12 05:11:21');
/*!40000 ALTER TABLE `student_class_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_daily_attendances`
--

DROP TABLE IF EXISTS `student_daily_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_daily_attendances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `clock_in_at` datetime DEFAULT NULL,
  `clock_out_at` datetime DEFAULT NULL,
  `clock_in_method` varchar(30) DEFAULT NULL,
  `clock_out_method` varchar(30) DEFAULT NULL,
  `entry_status` varchar(20) DEFAULT NULL,
  `exit_status` varchar(20) DEFAULT NULL,
  `attendance_status` varchar(20) NOT NULL DEFAULT 'INCOMPLETE',
  `late_minutes` int NOT NULL DEFAULT '0',
  `note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_student_daily_attendances_student_date` (`student_id`,`attendance_date`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `shift_id` (`shift_id`),
  KEY `idx_student_daily_attendances_date` (`attendance_date`),
  KEY `idx_student_daily_attendances_class_status` (`class_id`,`attendance_status`),
  CONSTRAINT `student_daily_attendances_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_daily_attendances_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_daily_attendances_ibfk_3` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_daily_attendances_ibfk_4` FOREIGN KEY (`shift_id`) REFERENCES `student_attendance_shifts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_daily_attendances`
--

LOCK TABLES `student_daily_attendances` WRITE;
/*!40000 ALTER TABLE `student_daily_attendances` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_daily_attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_documents`
--

DROP TABLE IF EXISTS `student_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `document_type_id` int NOT NULL,
  `document_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `document_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `student_id` (`student_id`) USING BTREE,
  KEY `document_type_id` (`document_type_id`) USING BTREE,
  KEY `created_by` (`created_by`) USING BTREE,
  KEY `updated_by` (`updated_by`) USING BTREE,
  CONSTRAINT `student_documents_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_documents_ibfk_2` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_documents_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_documents_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_documents`
--

LOCK TABLES `student_documents` WRITE;
/*!40000 ALTER TABLE `student_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_mutation_logs`
--

DROP TABLE IF EXISTS `student_mutation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_mutation_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mutation_id` int NOT NULL,
  `action` varchar(30) NOT NULL,
  `action_note` text,
  `action_by` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `action_by` (`action_by`),
  KEY `idx_mutation_logs_mutation_id` (`mutation_id`),
  KEY `idx_mutation_logs_action_created_at` (`action`,`created_at`),
  CONSTRAINT `student_mutation_logs_ibfk_1` FOREIGN KEY (`mutation_id`) REFERENCES `student_mutations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_mutation_logs_ibfk_2` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_mutation_logs`
--

LOCK TABLES `student_mutation_logs` WRITE;
/*!40000 ALTER TABLE `student_mutation_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_mutation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_mutations`
--

DROP TABLE IF EXISTS `student_mutations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_mutations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `academic_year_id` int DEFAULT NULL,
  `mutation_type` varchar(10) NOT NULL,
  `mutation_category` varchar(30) NOT NULL,
  `mutation_date` date NOT NULL,
  `effective_date` date NOT NULL,
  `destination_school` varchar(150) DEFAULT NULL,
  `origin_school` varchar(150) DEFAULT NULL,
  `reason` text NOT NULL,
  `description` text,
  `document_number` varchar(100) DEFAULT NULL,
  `document_file` varchar(255) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `notes` text,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `approved_by` (`approved_by`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_student_mutations_student_status` (`student_id`,`status`),
  KEY `idx_student_mutations_type_status` (`mutation_type`,`status`),
  KEY `idx_student_mutations_date` (`mutation_date`),
  CONSTRAINT `student_mutations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_mutations_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_mutations_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_mutations_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_mutations_ibfk_5` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_mutations`
--

LOCK TABLES `student_mutations` WRITE;
/*!40000 ALTER TABLE `student_mutations` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_mutations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_positive_points`
--

DROP TABLE IF EXISTS `student_positive_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_positive_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `type_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `points` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `evidence_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `student_id` (`student_id`) USING BTREE,
  KEY `type_id` (`type_id`) USING BTREE,
  KEY `academic_year_id` (`academic_year_id`) USING BTREE,
  KEY `created_by` (`created_by`) USING BTREE,
  KEY `approved_by` (`approved_by`) USING BTREE,
  CONSTRAINT `student_positive_points_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_positive_points_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `positive_point_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_positive_points_ibfk_3` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_positive_points_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_positive_points_ibfk_5` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_positive_points`
--

LOCK TABLES `student_positive_points` WRITE;
/*!40000 ALTER TABLE `student_positive_points` DISABLE KEYS */;
INSERT INTO `student_positive_points` VALUES (1,228,2,1,'2026-03-02','Lingkungan Sekolah',3,'Membantu pembuatan hampers sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:19:26'),(2,232,2,1,'2026-03-02','Lingkungan Sekolah',3,'Membantu pembuatan hampers sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:19:41'),(3,236,2,1,'2026-03-02','Lingkungan Sekolah',3,'Membantu pembuatan hampers sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:20:00'),(4,229,2,1,'2026-03-02','Lingkungan Sekolah',3,'Membantu pembuatan hampers sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:20:18'),(5,235,2,1,'2026-03-02','Lingkungan Sekolah',5,'Membantu pembuatan hampers sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:20:31'),(6,81,1,1,'2025-08-13','Lingkungan Sekolah',5,'Menjadi Pradana Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 03:22:17'),(7,99,1,1,'2025-08-13','Lingkungan Sekolah',5,'Menjadi ketua OSIS',NULL,'APPROVED',1,NULL,'2026-03-13 03:22:53'),(8,208,2,1,'2025-09-11','Lingkungan Sekolah',1,'Membantu persiapan pemilihan OSIS',NULL,'APPROVED',1,NULL,'2026-03-13 03:25:18'),(9,231,2,1,'2025-09-11','Lingkungan Sekolah',1,'Membantu persiapan pemilihan OSIS',NULL,'APPROVED',1,NULL,'2026-03-13 03:25:40'),(10,232,2,1,'2025-09-11','Lingkungan Sekolah',1,'Membantu persiapan pemilihan OSIS',NULL,'APPROVED',1,NULL,'2026-03-13 03:26:02'),(11,132,2,1,'2025-09-11','Lingkungan Sekolah',1,'Membantu persiapan pemilihan OSIS',NULL,'APPROVED',1,NULL,'2026-03-13 03:26:22'),(12,229,2,1,'2025-09-11','Lingkungan Sekolah',1,'Membantu persiapan pemilihan OSIS',NULL,'APPROVED',1,NULL,'2026-03-13 03:26:40'),(13,129,2,1,'2025-09-11','Lingkungan Sekolah',1,'Membantu persiapan pemilihan OSIS',NULL,'APPROVED',1,NULL,'2026-03-13 03:27:29'),(14,144,4,1,'2025-09-17','Lingkungan Sekolah',1,'Membantu kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:28:51'),(15,79,4,1,'2025-09-17','Lingkungan Sekolah',1,'Membantu kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:29:10'),(16,93,4,1,'2025-09-17','Lingkungan Sekolah',1,'Membantu kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:29:27'),(17,138,4,1,'2025-09-20','Lingkungan Sekolah',1,'Membantu kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:30:51'),(18,144,2,1,'2025-09-24','Lab. APHP',1,'Membantu penataan lab. APHP',NULL,'APPROVED',1,NULL,'2026-03-13 03:32:08'),(19,137,4,1,'2025-09-27','Lingkungan Sekolah',1,'Membantu kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:32:53'),(20,202,2,1,'2025-09-29','Lingkungan Sekolah',1,'Membuat program podcast',NULL,'APPROVED',1,NULL,'2026-03-13 03:33:41'),(21,203,2,1,'2025-09-29','Lingkungan Sekolah',1,'Membuat program podcast',NULL,'APPROVED',1,NULL,'2026-03-13 03:34:01'),(22,208,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:35:06'),(23,231,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:35:24'),(24,232,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:35:52'),(25,229,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:36:17'),(26,230,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:36:33'),(27,132,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:36:56'),(28,105,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:37:19'),(29,155,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:37:39'),(30,162,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:38:15'),(31,131,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:38:47'),(32,154,2,1,'2025-09-30','Lingkungan Sekolah',1,'Koordinasi persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:39:10'),(33,84,2,1,'2025-10-02','Lingkungan Sekolah',1,'Membantu persiapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:40:19'),(34,92,2,1,'2025-10-02','Lingkungan Sekolah',1,'Membantu persiapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:40:41'),(35,96,2,1,'2025-10-02','Lingkungan Sekolah',1,'Membantu persiapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:41:01'),(36,35,2,1,'2025-10-02','Lingkungan Sekolah',1,'Membantu persiapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:41:21'),(37,124,2,1,'2025-10-02','Lingkungan Sekolah',1,'Membantu persiapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:41:50'),(38,177,2,1,'2025-10-02','Lingkungan Sekolah',1,'Membantu persiapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:42:08'),(39,93,2,1,'2025-10-04','Lingkungan Sekolah',1,'Membantu menata ruang ujian',NULL,'APPROVED',1,NULL,'2026-03-13 03:42:57'),(40,144,2,1,'2025-10-04','Lingkungan Sekolah',1,'Membantu menata ruang ujian',NULL,'APPROVED',1,NULL,'2026-03-13 03:43:18'),(41,86,2,1,'2025-10-04','Lingkungan Sekolah',1,'Membantu menata ruang ujian',NULL,'APPROVED',1,NULL,'2026-03-13 03:43:43'),(42,138,2,1,'2025-10-04','Lingkungan Sekolah',1,'Membantu menata ruang ujian',NULL,'APPROVED',1,NULL,'2026-03-13 03:44:01'),(43,137,2,1,'2025-10-04','Lingkungan Sekolah',1,'Membantu menata ruang ujian',NULL,'APPROVED',1,NULL,'2026-03-13 03:44:26'),(44,79,2,1,'2025-10-04','Lingkungan Sekolah',1,'Membantu menata ruang ujian',NULL,'APPROVED',1,NULL,'2026-03-13 03:44:55'),(45,204,2,1,'2025-10-07','Lingkungan Sekolah',1,'Membantu persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:45:40'),(46,204,2,1,'2025-10-07','Lingkungan Sekolah',1,'Membantu persiapan pameran sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:46:43'),(47,202,2,1,'2025-10-07','Lingkungan Sekolah',1,'Membantu persiapan pameran sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:46:59'),(48,203,2,1,'2025-10-07','Lingkungan Sekolah',1,'Membantu persiapan pameran sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:47:14'),(49,95,2,1,'2025-10-08','Lingkungan Sekolah',1,'Membantu persiapan anovitas',NULL,'APPROVED',1,NULL,'2026-03-13 03:47:56'),(50,201,2,1,'2025-10-10','Lingkungan Sekolah',1,'Membantu persiapan pameran sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:48:33'),(51,144,2,1,'2025-10-10','Lingkungan Sekolah',1,'Membantu persiapan pameran sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:48:50'),(52,143,2,1,'2025-10-10','Lingkungan Sekolah',1,'Membantu persiapan pameran sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 03:49:07'),(53,81,2,1,'2025-10-11','Lingkungan Sekolah',5,'Panitia JOTA JOTI Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 03:49:57'),(54,79,2,1,'2025-10-11','Lingkungan Sekolah',5,'Panitia JOTA JOTI Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 03:50:19'),(55,186,2,1,'2025-10-11','Lab. TKJ',1,'Membantu penataan Lab. TKJ',NULL,'APPROVED',1,NULL,'2026-03-13 03:51:37'),(56,171,2,1,'2025-10-11','Lab. TKJ',1,'Membantu Penataan Lab. TKJ',NULL,'APPROVED',1,NULL,'2026-03-13 03:52:01'),(57,14,2,1,'2025-10-11','Lab. TKJ',1,'Membantu Penataan Lab. TKJ',NULL,'APPROVED',1,NULL,'2026-03-13 03:52:25'),(58,181,2,1,'2025-10-13','Lingkungan Sekolah',1,'Panitia perlengkapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:53:51'),(59,171,2,1,'2025-10-13','Lingkungan Sekolah',1,'Panitia perlengkapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:54:06'),(60,199,2,1,'2025-10-13','Lingkungan Sekolah',1,'Panitia perlengkapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:54:28'),(61,173,2,1,'2025-10-13','Lingkungan Sekolah',1,'Panitia perlengkapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:54:46'),(62,222,2,1,'2025-10-13','Lingkungan Sekolah',1,'Panitia perlengkapan ANOVITAS',NULL,'APPROVED',1,NULL,'2026-03-13 03:55:12'),(63,223,2,1,'2025-10-13','Lingkungan Sekolah',1,'Membantu persiapan anovitas dan jota joti',NULL,'APPROVED',1,NULL,'2026-03-13 03:56:12'),(64,221,2,1,'2025-10-13','Lingkungan Sekolah',1,'Membantu persiapan anovitas dan jota joti',NULL,'APPROVED',1,NULL,'2026-03-13 03:56:28'),(65,225,2,1,'2025-10-13','Lingkungan Sekolah',1,'Membantu persiapan anovitas dan jota joti',NULL,'APPROVED',1,NULL,'2026-03-13 03:56:48'),(66,81,4,1,'2025-10-14','Lingkungan Sekolah',1,'Piket kebersihan lingkungan sekolah(pasca jota joti)',NULL,'APPROVED',1,NULL,'2026-03-13 03:57:52'),(67,138,4,1,'2025-10-14','Lingkungan Sekolah',1,'Piket kebersihan lingkungan sekolah(pasca jota joti)',NULL,'APPROVED',1,NULL,'2026-03-13 03:59:06'),(68,144,4,1,'2025-10-14','Lingkungan Sekolah',1,'Piket kebersihan lingkungan sekolah(pasca jota joti)',NULL,'APPROVED',1,NULL,'2026-03-13 03:59:25'),(69,93,4,1,'2025-10-14','Lingkungan Sekolah',1,'Piket kebersihan lingkungan sekolah(pasca jota joti)',NULL,'APPROVED',1,NULL,'2026-03-13 04:00:08'),(70,79,4,1,'2025-10-14','Lingkungan Sekolah',1,'Piket kebersihan lingkungan sekolah(pasca jota joti)',NULL,'APPROVED',1,NULL,'2026-03-13 04:00:27'),(71,137,4,1,'2025-10-14','Lingkungan Sekolah',1,'',NULL,'APPROVED',1,NULL,'2026-03-13 04:00:47'),(72,86,4,1,'2025-10-14','Lingkungan Sekolah',1,'Piket kebersihan lingkungan sekolah(pasca jota joti)',NULL,'APPROVED',1,NULL,'2026-03-13 04:01:06'),(73,143,2,1,'2025-10-15','Lingkungan Sekolah',1,'Pembuatan kerajinan untuk jota-joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:02:11'),(74,144,2,1,'2025-10-15','Lingkungan Sekolah',1,'Pembuatan kerajinan untuk jota-joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:02:26'),(75,137,2,1,'2025-10-15','Lingkungan Sekolah',1,'Pembuatan kerajinan untuk jota-joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:02:47'),(76,32,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:03:44'),(77,79,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:05:34'),(78,143,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:05:50'),(79,144,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:06:10'),(80,4,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:06:27'),(81,53,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:06:59'),(82,1,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:07:26'),(83,137,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:07:58'),(84,138,2,1,'2025-10-16','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:08:16'),(85,202,2,1,'2025-10-18','Lingkungan Sekolah',5,'Panitia Pameran Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:09:25'),(86,201,2,1,'2025-10-18','Lingkungan Sekolah',5,'Panitia Pameran Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:09:42'),(87,203,2,1,'2025-10-18','Lingkungan Sekolah',5,'Panitia Pameran Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:09:58'),(88,34,2,1,'2025-10-18','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:10:54'),(89,33,2,1,'2025-10-18','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:11:12'),(90,7,2,1,'2025-10-18','Lingkungan Sekolah',5,'Panitia Jota-Joti',NULL,'APPROVED',1,NULL,'2026-03-13 04:11:36'),(91,186,2,1,'2025-10-20','Lingkungan Sekolah',1,'Perbaikan Lab. TKJ',NULL,'APPROVED',1,NULL,'2026-03-13 04:12:49'),(92,183,2,1,'2025-10-20','Lingkungan Sekolah',1,'Perbaikan Lab. TKJ',NULL,'APPROVED',1,NULL,'2026-03-13 04:13:12'),(93,181,2,1,'2026-02-13','Lingkungan Sekolah',3,'Membuat video promosi sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:06:25'),(94,176,2,1,'2026-02-13','Lingkungan Sekolah',3,'Membuat video promosi sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:06:48'),(95,202,2,1,'2025-11-06','Lingkungan Sekolah',2,'Membuat karya seni lukisan di dinding sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:08:10'),(96,201,2,1,'2025-11-06','Lingkungan Sekolah',2,'Membuat karya seni lukisan di dinding sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:08:38'),(97,200,2,1,'2025-11-06','Lingkungan Sekolah',2,'Membuat karya seni lukisan di dinding sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:21:23'),(98,197,2,1,'2025-11-06','Lingkungan Sekolah',2,'Membuat karya seni lukisan di dinding sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:22:47'),(99,196,2,1,'2025-11-06','Lingkungan Sekolah',2,'Membuat karya seni lukisan di dinding sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:24:18'),(100,29,2,1,'2025-11-06','Lingkungan Sekolah',2,'Membuat karya seni lukisan di dinding sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:26:44'),(101,121,2,1,'2025-11-06','Lingkungan Sekolah',2,'Membuat karya seni lukisan di dinding sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:28:11'),(102,79,4,1,'2025-11-08','Lingkungan Sekolah',1,'Piket kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:31:11'),(103,86,4,1,'2025-11-08','Lingkungan Sekolah',1,'Piket kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:31:32'),(104,99,4,1,'2025-11-08','Lingkungan Sekolah',1,'Piket kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:31:50'),(105,143,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:33:42'),(106,48,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:34:06'),(107,35,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:34:21'),(108,29,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:34:48'),(109,226,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:35:04'),(110,202,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:35:28'),(111,201,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:35:46'),(112,196,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:36:09'),(113,6,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:36:25'),(114,14,2,1,'2025-11-17','Lingkungan Sekolah',3,'Panitia pameran produk sekolah - Haul',NULL,'APPROVED',1,NULL,'2026-03-13 06:36:40'),(115,143,4,1,'2025-11-22','Lingkungan Sekolah',1,'Piket kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:38:29'),(116,93,4,1,'2025-11-22','Lingkungan Sekolah',1,'Piket kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:38:45'),(117,138,4,1,'2025-11-22','Lingkungan Sekolah',1,'Piket kebersihan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 06:39:08'),(118,71,2,1,'2025-11-29','Surakarta',5,'Pertemuan Ilmiah Nasional Asisten Tenaga Kesehatan Indonesia ',NULL,'APPROVED',1,NULL,'2026-03-13 06:40:17'),(119,73,2,1,'2025-11-29','Surakarta',5,'Pertemuan Ilmiah Nasional Asisten Tenaga Kesehatan Indonesia ',NULL,'APPROVED',1,NULL,'2026-03-13 06:40:39'),(120,75,2,1,'2025-11-29','Surakarta',5,'Pertemuan Ilmiah Nasional Asisten Tenaga Kesehatan Indonesia ',NULL,'APPROVED',1,NULL,'2026-03-13 06:40:56'),(121,81,1,1,'2025-12-04','Sumberingin',5,'Instruktur Outbond pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:42:14'),(122,79,1,1,'2025-12-04','Sumberingin',5,'Instruktur Outbond pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:42:44'),(123,6,1,1,'2025-12-04','Sumberingin',5,'Instruktur Outbond pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:43:43'),(124,143,1,1,'2025-12-04','Sumberingin',5,'Instruktur Outbond pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:43:57'),(125,89,1,1,'2025-12-04','Sumberingin',5,'Instruktur Outbond pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:44:32'),(126,1,1,1,'2025-12-04','Sumberingin',5,'Instruktur Outbond pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:44:57'),(127,138,1,1,'2025-12-04','Sumberingin',5,'Instruktur Outbond pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:45:14'),(128,208,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:51:17'),(129,105,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:51:35'),(130,62,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:52:23'),(131,40,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:53:27'),(132,145,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:54:46'),(133,129,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:55:30'),(134,64,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:55:45'),(135,57,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:56:43'),(136,232,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:57:02'),(137,61,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:57:20'),(138,138,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:57:49'),(139,81,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 06:59:59'),(140,1,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:00:25'),(141,141,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:01:59'),(142,47,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:03:27'),(143,7,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:03:53'),(144,53,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:05:08'),(145,6,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:05:26'),(146,33,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:09:22'),(147,26,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:09:47'),(148,83,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:10:08'),(149,34,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:10:29'),(150,32,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:10:43'),(151,79,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:11:04'),(152,14,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:11:22'),(153,122,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:11:45'),(154,143,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:12:03'),(155,9,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:12:20'),(156,51,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:12:43'),(157,56,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:13:04'),(158,27,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:13:23'),(159,15,1,1,'2025-12-28','Sumberingin',5,'Penempuhan Bedge Bantara - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 07:13:44'),(160,143,1,1,'2026-01-11','Lanud',5,'Orientasi SAKA DIRGANTARA - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 09:43:14'),(161,81,1,1,'2026-01-11','Lanud',5,'Orientasi SAKA DIRGANTARA - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 09:43:35'),(162,32,1,1,'2026-01-11','Lanud',5,'Orientasi SAKA DIRGANTARA - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 09:43:52'),(163,79,1,1,'2026-01-11','Lanud',5,'Orientasi SAKA DIRGANTARA - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 09:44:21'),(164,138,1,1,'2026-01-11','Lanud',5,'Orientasi SAKA DIRGANTARA - Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 09:44:37'),(165,79,2,1,'2026-01-11','Lingkungan Sekolah',2,'Persiapan launching kurikulum Apple',NULL,'APPROVED',1,NULL,'2026-03-13 09:46:25'),(166,32,2,1,'2026-01-11','Lingkungan Sekolah',2,'Persiapan launching kurikulum Apple',NULL,'APPROVED',1,NULL,'2026-03-13 09:46:44'),(167,137,2,1,'2026-01-11','Lingkungan Sekolah',2,'Persiapan launching kurikulum Apple',NULL,'APPROVED',1,NULL,'2026-03-13 09:47:01'),(168,143,2,1,'2026-01-11','Lingkungan Sekolah',2,'Persiapan launching kurikulum Apple',NULL,'APPROVED',1,NULL,'2026-03-13 09:47:27'),(169,132,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 09:50:55'),(170,61,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:01:12'),(171,107,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:01:32'),(172,105,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:01:54'),(173,127,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:02:10'),(174,129,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:02:26'),(175,37,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:02:46'),(176,154,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:03:02'),(177,103,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:03:16'),(178,150,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:03:34'),(179,164,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:04:06'),(180,60,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:04:31'),(181,42,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:04:51'),(182,39,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:05:15'),(183,57,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:05:37'),(184,146,1,1,'2026-01-11','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:05:56'),(185,161,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:06:22'),(186,155,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:06:40'),(187,162,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:07:02'),(188,62,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:07:16'),(189,66,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:07:33'),(190,131,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:07:54'),(191,59,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:08:29'),(192,130,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:08:47'),(193,138,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:09:59'),(194,143,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:10:16'),(195,47,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:10:31'),(196,25,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:10:48'),(197,35,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:11:02'),(198,90,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:11:29'),(199,124,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:11:45'),(200,33,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:12:01'),(201,32,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:12:19'),(202,141,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:12:39'),(203,31,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:12:54'),(204,53,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:13:11'),(205,1,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:13:50'),(206,49,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:14:04'),(207,51,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:14:27'),(208,22,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:14:45'),(209,140,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:15:02'),(210,83,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:15:22'),(211,93,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:15:37'),(212,99,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:15:58'),(213,137,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:16:13'),(214,89,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:16:27'),(215,98,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:16:39'),(216,117,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:16:54'),(217,50,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:17:13'),(218,126,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:17:29'),(219,96,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:17:44'),(220,82,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:18:01'),(221,86,1,1,'2026-01-21','MCC',5,'Aktif mengikuti OSIS + LDK',NULL,'APPROVED',1,NULL,'2026-03-13 10:18:15'),(222,169,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:24:37'),(223,173,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:24:56'),(224,172,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:25:16'),(225,176,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:25:34'),(226,138,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:27:04'),(227,35,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:27:17'),(228,86,2,1,'2026-02-02','Lingkungan Sekolah',5,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:27:38'),(229,165,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:27:54'),(230,182,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:28:10'),(231,180,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:28:38'),(232,18,2,1,'2026-01-29','Lingkungan Sekolah',3,'Memasang jaringan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 10:30:14'),(233,47,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:31:59'),(234,201,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:32:14'),(235,197,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:32:52'),(236,199,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:33:10'),(237,99,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:33:33'),(238,93,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:33:47'),(239,166,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:34:06'),(240,18,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:34:25'),(241,88,2,1,'2026-02-02','Lingkungan Sekolah',3,'Membantu persiapan dan pelaksanaan LKS',NULL,'APPROVED',1,NULL,'2026-03-13 10:34:41'),(242,31,3,1,'2026-02-06','RS Prima Husada',2,'Menjenguk siswa yang sakit',NULL,'APPROVED',1,NULL,'2026-03-13 10:36:00'),(243,88,2,1,'2026-02-13','Lingkungan Sekolah',2,'Membantu memasang jaringan sekolah',NULL,'APPROVED',1,NULL,'2026-03-13 10:37:02'),(244,83,1,1,'2025-08-13','Lingkungan Sekolah',5,'Menjadi wakil ketua osis',NULL,'APPROVED',1,NULL,'2026-03-13 10:39:12'),(245,132,1,1,'2025-08-13','Lingkungan Sekolah',5,'Menjadi Ketua Osis',NULL,'APPROVED',1,NULL,'2026-03-13 10:39:49'),(246,1,1,1,'2025-08-13','Lingkungan Sekolah',2,'Menjadi bendahara osis',NULL,'APPROVED',1,NULL,'2026-03-13 10:42:17'),(247,105,1,1,'2025-08-13','Lingkungan Sekolah',2,'Menjadi sekertaris Osis',NULL,'APPROVED',1,NULL,'2026-03-13 10:42:46'),(248,107,1,1,'2025-08-13','Lingkungan Sekolah',2,'menjadi bendahara osis',NULL,'APPROVED',1,NULL,'2026-03-13 10:43:10'),(249,124,1,1,'2025-08-13','Lingkungan Sekolah',2,'Menjadi sekertaris Osis',NULL,'APPROVED',1,NULL,'2026-03-13 10:43:45'),(250,79,1,1,'2025-08-13','Lingkungan Sekolah',3,'Dewan Ambalan Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 10:45:31'),(251,32,1,1,'2025-08-13','Lingkungan Sekolah',3,'Dewan Ambalan Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 10:45:59'),(252,1,1,1,'2025-08-13','Lingkungan Sekolah',3,'Dewan Ambalan Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 10:46:16'),(253,34,1,1,'2025-08-13','Lingkungan Sekolah',3,'Dewan Ambalan Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 10:46:36'),(254,53,1,1,'2025-08-13','Lingkungan Sekolah',3,'Dewan Ambalan Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 10:46:53'),(255,4,1,1,'2025-08-13','Lingkungan Sekolah',3,'Dewan Ambalan Pramuka',NULL,'APPROVED',1,NULL,'2026-03-13 10:47:10');
/*!40000 ALTER TABLE `student_positive_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_toilet_permissions`
--

DROP TABLE IF EXISTS `student_toilet_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_toilet_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `permission_date` date NOT NULL,
  `exit_at` datetime DEFAULT NULL,
  `return_at` datetime DEFAULT NULL,
  `duration_minutes` int NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'OUT',
  `note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `academic_year_id` (`academic_year_id`),
  KEY `idx_student_toilet_permissions_student_date` (`student_id`,`permission_date`),
  KEY `idx_student_toilet_permissions_date_status` (`permission_date`,`status`),
  KEY `idx_student_toilet_permissions_class` (`class_id`),
  CONSTRAINT `student_toilet_permissions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_toilet_permissions_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `student_toilet_permissions_ibfk_3` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_toilet_permissions`
--

LOCK TABLES `student_toilet_permissions` WRITE;
/*!40000 ALTER TABLE `student_toilet_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_toilet_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_toilet_scan_logs`
--

DROP TABLE IF EXISTS `student_toilet_scan_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_toilet_scan_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `toilet_permission_id` int DEFAULT NULL,
  `scanned_rfid_code` varchar(100) NOT NULL,
  `scanned_at` datetime NOT NULL,
  `scan_type` varchar(20) DEFAULT NULL,
  `result_status` varchar(30) NOT NULL,
  `result_message` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `toilet_permission_id` (`toilet_permission_id`),
  KEY `idx_student_toilet_scan_logs_scanned_at` (`scanned_at`),
  KEY `idx_student_toilet_scan_logs_student_scanned_at` (`student_id`,`scanned_at`),
  KEY `idx_student_toilet_scan_logs_result_status` (`result_status`),
  CONSTRAINT `student_toilet_scan_logs_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_toilet_scan_logs_ibfk_2` FOREIGN KEY (`toilet_permission_id`) REFERENCES `student_toilet_permissions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_toilet_scan_logs`
--

LOCK TABLES `student_toilet_scan_logs` WRITE;
/*!40000 ALTER TABLE `student_toilet_scan_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_toilet_scan_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_violations`
--

DROP TABLE IF EXISTS `student_violations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_violations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `type_id` int NOT NULL,
  `date` date DEFAULT NULL,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `evidence_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `student_id` (`student_id`) USING BTREE,
  KEY `type_id` (`type_id`) USING BTREE,
  KEY `created_by` (`created_by`) USING BTREE,
  KEY `approved_by` (`approved_by`) USING BTREE,
  CONSTRAINT `student_violations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_violations_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `violation_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_violations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_violations_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_violations`
--

LOCK TABLES `student_violations` WRITE;
/*!40000 ALTER TABLE `student_violations` DISABLE KEYS */;
INSERT INTO `student_violations` VALUES (1,222,26,'2025-03-12','Lingkungan Sekolah','Beberapa siswa merokok di lt 4 dan sudah membuat surat pernyataan',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:36:56'),(2,173,26,'2025-03-12','Lingkungan Sekolah','Beberapa siswa merokok di lt 4 dan sudah membuat surat pernyataan',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:37:12'),(3,199,26,'2025-03-12','Lingkungan Sekolah','Beberapa siswa merokok di lt 4 dan sudah membuat surat pernyataan',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:37:50'),(4,225,26,'2025-03-12','Lingkungan Sekolah','Beberapa siswa merokok di lt 4 dan sudah membuat surat pernyataan',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:38:59'),(5,223,26,'2025-03-12','Lingkungan Sekolah','Beberapa siswa merokok di lt 4 dan sudah membuat surat pernyataan',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:39:30'),(6,171,26,'2025-03-12','Lingkungan Sekolah','Beberapa siswa merokok di lt 4 dan sudah membuat surat pernyataan',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:39:51'),(7,190,26,'2025-03-12','Lingkungan Sekolah','Beberapa siswa merokok di lt 4 dan sudah membuat surat pernyataan',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:40:10'),(8,198,37,'2025-11-26','Lingkungan Sekolah','Galih mengabsenkan siswa lain atas nama ravka maulana',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:43:12'),(9,196,37,'2025-11-26','Lingkungan Sekolah','Dzikra mengabsenkan siswa lain atas nama ravka maulana',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:44:25'),(10,189,38,'2025-11-26','Lingkungan Sekolah','Siswa menitipkan absen ke dzikra dan galih',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:46:41'),(11,181,23,'2025-09-25','Arah timur sekolah','Siswa kabur dengan beberapa teman ke luar sekolah saat jam pelajaran',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:48:34'),(12,184,23,'2025-09-25','Arah timur sekolah','Siswa kabur dengan beberapa teman ke luar sekolah saat jam pelajaran',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:49:56'),(13,78,23,'2025-11-24','Luar Sekolah','Terlambat dan kabur dari sekolah tanpa ijin',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:50:51'),(14,177,17,'2025-11-20','Lingkungan Sekolah','Tidak mengikuti pembelajaran di sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:51:58'),(15,202,21,'2025-11-20','Lingkungan Sekolah','Pulang ke pondok tanpa surat ijin mulai jam 8',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:53:22'),(16,4,26,'2025-11-08','Kamar Mandi Siswa','Merokok di depan kamar mandi siswa',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:54:04'),(17,24,20,'2025-11-08','Lingkungan Sekolah','Membawa rokok 1 pack',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:54:39'),(18,179,23,'2025-09-25','Arah timur sekolah','Siswa kabur dengan beberapa teman ke luar sekolah saat jam pelajaran',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:55:43'),(19,182,17,'2025-11-20','Luar Sekolah','Tidak mengikuti pembelajaran',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:56:40'),(20,172,17,'2025-11-20','Luar Sekolah','Tidak mengikuti pembelajaran',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:58:39'),(21,173,17,'2026-01-26','Toilet','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 05:59:33'),(22,196,17,'2026-01-26','Toilet','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:00:13'),(23,201,17,'2026-01-26','Toilet','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:00:55'),(24,179,17,'2026-01-26','Toilet','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:01:42'),(25,184,17,'2026-01-26','Toilet','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:02:22'),(26,191,17,'2026-01-26','Toilet','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:02:55'),(27,184,17,'2025-11-29','Lingkungan Sekolah','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:03:37'),(28,4,26,'2025-03-12','Toilet','Terlambat dan merokok di sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:04:26'),(29,201,20,'2025-10-03','Sekolah','Membawa rokok di sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:05:15'),(30,185,20,'2025-10-03','Sekolah','Razia - Membawa rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:05:58'),(31,193,20,'2025-10-03','Sekolah','Razia - membawa rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:06:38'),(32,80,17,'2025-11-29','Toilet','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:07:47'),(33,116,20,'2025-10-03','Sekolah','Razia - membawa rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:08:24'),(34,169,20,'2025-10-03','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:09:08'),(35,182,5,'2025-10-03','Sekolah','Razia - Membawa hp',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:09:47'),(36,221,20,'2025-10-03','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:10:23'),(37,184,20,'2025-10-03','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:11:44'),(38,23,26,'2025-10-07','Sekolah','Merokok di toilet sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:12:27'),(39,176,17,'2025-11-29','Sekolah','Tidak mengikuti tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:13:22'),(40,176,18,'2025-11-29','Sekolah','saat ditegur guru karena tidak mengikuti tahfidz, siswa membangkang dan menjawab tidak sopan',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:14:05'),(41,196,12,'2026-03-09','Sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:15:10'),(42,184,12,'2026-03-09','sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:15:42'),(43,165,12,'2026-03-09','sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:16:26'),(44,201,12,'2026-03-09','Sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:16:58'),(45,192,12,'2026-03-09','sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:17:22'),(46,171,12,'2026-03-09','sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:18:13'),(47,199,12,'2026-03-09','Sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:29:27'),(48,187,12,'2026-03-09','sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:29:54'),(49,186,12,'2026-03-09','sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:30:17'),(50,197,12,'2026-03-09','Sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:30:44'),(51,189,12,'2026-03-09','sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:34:10'),(52,198,12,'2026-03-09','Sekolah','Tidak mengikuti ujian pada waktunya dan memilih mengikuti ujian susulan dengan alasan ketiduran di pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:34:32'),(53,33,29,'2026-02-01','Depan gerbang sekolah','siswa menemui teman(indikasi pacar) 2x di dekat pertigaan sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:38:00'),(54,79,26,'2025-08-19','Lt 3','Siswa merokok bersama siswa sma di lantai 3',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:39:27'),(55,190,20,'2025-08-20','Sekolah','Razia - Membawa rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:41:52'),(56,191,20,'2025-08-20','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:42:27'),(57,221,20,'2025-08-20','sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:43:03'),(58,170,20,'2025-08-20','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:43:31'),(59,143,20,'2025-08-20','Sekolah','Razia - Membawa Rokok dan HP',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:44:03'),(60,36,20,'2025-08-20','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:44:31'),(61,30,20,'2025-08-20','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:45:01'),(62,13,20,'2025-08-20','Sekolah','Razia - Membawa Rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:45:33'),(63,118,6,'2025-08-20','Sekolah','Tidur di sekolah tanpa ijin',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:46:11'),(64,118,18,'2025-08-20','Sekolah','menyobek pengumuman bahwa faisal salah satu siswa yang tertidur',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:46:46'),(65,80,11,'2025-08-20','Sekolah','Tidak ikut ekskul wajib pramuka',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:47:50'),(66,119,11,'2025-08-20','Sekolah','Tidak ikut ekskul wajib pramuka',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:48:39'),(67,139,11,'2025-08-20','Sekolah','Tidak ikut ekskul wajib pramuka',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:49:13'),(68,96,11,'2025-08-20','Sekolah','Tidak ikut ekskul wajib pramuka',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:49:41'),(69,84,11,'2025-08-20','Sekolah','Tidak ikut ekskul wajib pramuka',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:50:13'),(70,78,11,'2025-08-20','Sekolah','Tidak ikut ekskul wajib pramuka',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:50:37'),(71,143,39,'2025-08-26','Sekolah','Mengambil sambal milik teman',NULL,'APPROVED',NULL,NULL,'2026-03-12 06:54:35'),(72,177,6,'2025-11-21','Sekolah','tidur dan tidak mengikuti kegiatan simtud',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:02:00'),(73,223,6,'2025-11-21','Sekolah','tidur dan tidak mengikuti kegiatan simtud',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:02:25'),(74,226,6,'2025-11-21','Sekolah','tidur dan tidak mengikuti kegiatan simtud',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:03:10'),(75,90,6,'2025-11-21','Sekolah','tidur dan tidak mengikuti kegiatan simtud',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:04:22'),(76,99,6,'2025-11-21','Sekolah','tidur dan tidak mengikuti kegiatan simtud',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:04:51'),(77,80,6,'2025-11-21','Sekolah','tidur dan tidak mengikuti kegiatan simtud',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:05:17'),(78,81,6,'2025-11-21','Sekolah','tidur dan tidak mengikuti kegiatan simtud',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:07:16'),(79,221,6,'2025-11-24','Ruang Keperawatan','Siswa tidur saat jam pelajaran',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:08:11'),(80,223,6,'2025-11-24','Sekolah','Siswa tidur saat jam pelajaran',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:08:29'),(81,198,2,'2026-01-03','Rumah Teman','Tidak masuk sekolah dan merokok di rumah teman dan di livekan di tiktok',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:17:01'),(82,185,2,'2026-01-03','Rumah Teman','Tidak masuk sekolah dan merokok di rumah teman dan di livekan tiktok',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:17:38'),(83,32,20,'2025-10-24','Sekolah','Membawa rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:18:46'),(84,223,2,'2025-11-07','Sekolah','Tidak masuk sekolah dan kabur.',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:20:06'),(85,221,2,'2025-11-07','Sekolah','Tidak masuk sekolah dan kabur.',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:20:29'),(86,220,2,'2025-11-07','Sekolah','Tidak masuk sekolah dan kabur.',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:20:54'),(87,225,17,'2025-10-25','Toilet','tidak masuk kelas dan berkumpul di belakang toilet',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:22:19'),(88,198,17,'2025-10-25','Toilet','tidak masuk kelas dan berkumpul di belakang toilet',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:22:48'),(89,99,26,'2025-12-09','Toilet','Merokok di belakang toilet setelah tahfidz',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:23:56'),(90,114,20,'2025-10-09','Sekolah','membawa rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:24:36'),(91,23,20,'2025-10-07','Sekolah','membawa rokok',NULL,'APPROVED',NULL,NULL,'2026-03-12 07:25:20'),(93,173,40,'2025-09-12','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:05:20'),(94,176,40,'2025-09-12','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:06:02'),(95,189,40,'2025-09-12','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:07:24'),(96,198,40,'2025-09-11','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:08:35'),(97,94,40,'2025-09-12','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:10:08'),(98,95,18,'2025-09-09','Sekolah','tidak sopan saat ditegur oleh TATIB ',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:10:54'),(99,95,40,'2025-09-12','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:11:21'),(100,95,16,'2025-09-12','Sekolah','Selalu terlambat ke sekolah dengan alasan dari pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:12:04'),(101,95,40,'2025-09-12','Sekolah','Sering tidak masuk',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:12:37'),(102,89,16,'2026-03-12','Sekolah','Selalu terlambat dengan alasan pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:13:04'),(103,89,40,'2025-09-12','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:13:26'),(104,101,16,'2025-09-12','Sekolah','Sering terlambat dengan alasan dari pondok',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:13:54'),(105,101,40,'2025-09-12','Sekolah','Rekap absen bulan september 2025',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:14:16'),(106,136,40,'2026-03-12','Sekolah','sering tidak masuk sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:16:07'),(107,142,40,'2025-09-12','Sekolah','Sering tidak masuk sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:16:51'),(108,137,40,'2026-01-12','Sekolah','Sering tidak masuk sekolah',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:18:08'),(109,189,41,'2025-09-12','Rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:20:43'),(110,198,41,'2025-09-09','Rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:21:04'),(111,179,41,'2026-03-12','Rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:21:27'),(112,125,41,'2026-01-12','Rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:21:53'),(113,137,41,'2026-01-12','Rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:22:30'),(114,94,41,'2026-01-12','','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:22:49'),(115,221,41,'2026-03-12','rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:24:03'),(116,171,17,'2026-01-21','Dea Bakery','Kabur ke singosari saat prakerin',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:25:14'),(117,171,42,'2025-09-12','Rumah','Membatalkan lomba mikrotik di h-1',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:27:07'),(118,78,41,'2026-01-12','Rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:28:06'),(119,4,41,'2026-01-12','Rumah','',NULL,'APPROVED',NULL,NULL,'2026-03-12 14:29:25');
/*!40000 ALTER TABLE `student_violations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nis` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nisn` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gender` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `rfid_code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `qr_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `barcode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `card_template_id` int DEFAULT NULL,
  `card_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `card_template_id` (`card_template_id`) USING BTREE,
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`card_template_id`) REFERENCES `card_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=238 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,'0693/0507.421','','AHMAD ASZRIL EKA PUTRA','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:44','2026-03-12 04:16:44'),(2,'0694/0508.421','','AHMAD AZKA FATHONI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:44','2026-03-12 04:16:44'),(3,'0695/0509.421','','AL PINO RASIT','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:44','2026-03-12 04:16:44'),(4,'0714/0528.421','','BAYU BINTANG','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:44','2026-03-12 04:16:44'),(5,'0696/0510.421','','ALFI NUR RAKHMAN','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:45','2026-03-12 04:16:45'),(6,'0697/0511.421','0098265839','DAMAR BIMANTARA SARABITI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:45','2026-03-12 04:16:45'),(7,'0698/0512.421','','FAIRUZ AKRKAN LAZUARDI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:45','2026-03-12 04:16:45'),(8,'','','FARHAN ZUFARRACHMAN','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:46','2026-03-12 04:16:46'),(9,'0741/0186.651','','HISYAM ASRAF HUDA MURTADHA','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:46','2026-03-12 04:16:46'),(10,'0700/0514.421','','ISA AL KAHFI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:46','2026-03-12 04:16:46'),(11,'0701/0515.421','','M. ALIF ADIB UBAIDILLAH','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:46','2026-03-12 04:16:46'),(12,'0715/0529.421','','MOCHAMMAD RIZKI PRATAMA','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:47','2026-03-12 04:16:47'),(13,'0703/0517.421','3093280932','M. ADI ARDIANSYAH','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:47','2026-03-12 04:16:47'),(14,'0704/0518.421','','M. FAYYADH AZIZI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:47','2026-03-12 04:16:47'),(15,'0705/0519.421','','M. HABIBUL ALI EL-GADRI RAMADHANI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:47','2026-03-12 04:16:47'),(16,'0706/0520.421','','MUHAMMAD RESQI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:48','2026-03-12 04:16:48'),(17,'0707/0521.421','','M.RENDY PRATAMA','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:48','2026-03-12 04:16:48'),(18,'0708/0522.421','','MOCH. RAYCHAN AL UTSMAN','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:48','2026-03-12 04:16:48'),(19,'0709/0523.421','','M.MELVIN RIDHO ARDIANSYAH','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:48','2026-03-12 04:16:48'),(20,'0710/0524.421','','MUHAMMAD AL QODRI','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:48','2026-03-12 04:16:48'),(21,'0711/0525.421','','MUHAMMAD REHAN','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:49','2026-03-12 04:16:49'),(22,'0712/0526.421','','M. RIZKY ARYO GUMILANG ABIMANYU','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:50','2026-03-12 04:16:50'),(23,'0713/0527.421',NULL,'SAMUDRA FATIHAH','L',NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:16:50','2026-03-12 04:16:50'),(24,'0714/0236.1021','','ADIRA MOZA PRATAMA','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:32','2026-03-12 04:55:32'),(25,'0715/0237.1021','','AKHMAD MISBACH FARIZKY','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:32','2026-03-12 04:55:32'),(26,'0717/0238.1021','','JUSA AZ FIRAH','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:33','2026-03-12 04:55:33'),(27,'0718/0239.1021','','M. ASADIL AZZAM','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:33','2026-03-12 04:55:33'),(28,'0719/0240.1021','','M. AUFAN ZAKY ALBAR','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:33','2026-03-12 04:55:33'),(29,'0720/0241.1021','','MUHAMMAD FIKRI FIRMANSYAH','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:33','2026-03-12 04:55:33'),(30,'0721/0242.1021','3109218248','M. MAULANA DANANG PRAYOGI','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:33','2026-03-12 04:55:33'),(31,'0722/0243.1021','','MOH. WAFA HUKMAH SHOBIYYA','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:33','2026-03-12 04:55:33'),(32,'0723/0244.1021','3102714849','M. ZEFRAN ADLIYA\'UL PRAMONO','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:33','2026-03-12 04:55:33'),(33,'0724/0245.1021','','MARVEL CHANDRA ADINATA','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:34','2026-03-12 04:55:34'),(34,'0725/0246.1021','0084485900','MOHAMMAD FACHRUDIN','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:34','2026-03-12 04:55:34'),(35,'0726/0247.1021','','OKI RAHMAT HIDAYATULLOH','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:34','2026-03-12 04:55:34'),(36,'0727/0248.1021','','RAHMAD RIZKY RAMADHANI','L','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:34','2026-03-12 04:55:34'),(37,'0728/0249.1021','','AMIRAH DZAKIYYAH AZ ZAHRA','P','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:34','2026-03-12 04:55:34'),(38,'0730/0251.1021','','DARA FATIMATUZ ZAHRA','P','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:34','2026-03-12 04:55:34'),(39,'0731/0252.1021','','HAFIDAH LAILIA SANI','P','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:34','2026-03-12 04:55:34'),(40,'0732/0253.1021','','NABILAH ZAHROTUL AINIYAH','P','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:35','2026-03-12 04:55:35'),(41,'0733/0254.1021','','NAJWA','P','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:35','2026-03-12 04:55:35'),(42,'0734/0255.1021','','QUEENA ANINDYA. A','P','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:35','2026-03-12 04:55:35'),(43,'0735/0256.1021',NULL,'YURANNA SA\'ILATUS','P','2010-02-02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:55:35','2026-03-12 04:55:35'),(44,'0736/0257.1021',NULL,'NESSA MA\'RIFATUL HIKMA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:56:24','2026-03-12 04:56:24'),(45,'0737/0258.1021',NULL,'NYSSA MA\'RIFATUL HUDA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:56:24','2026-03-12 04:56:24'),(46,'0736/0181.651',NULL,'ACHMAD ANIS SYAUQI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:23','2026-03-12 04:58:23'),(47,'0737/0182.651',NULL,'AHMAD KURNIAWAN JULIANSYAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:23','2026-03-12 04:58:23'),(48,'0738/0183.651',NULL,'AHMAD RIJAL DAIFULLAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:23','2026-03-12 04:58:23'),(49,'0758/0202.651',NULL,'AHMAD RAIHAAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:24','2026-03-12 04:58:24'),(50,'0739/0184.651',NULL,'ANDHI PRASETYO','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:24','2026-03-12 04:58:24'),(51,'0740/0185.651',NULL,'BINTANG MUHAMMAD HABIBI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:24','2026-03-12 04:58:24'),(52,'0742/0187.651',NULL,'LEVY DHIEKA NUR FIRANSYAH ','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:24','2026-03-12 04:58:24'),(53,'0743/0188.651',NULL,'MOCHAMMAD ALFIN ZIDNA FAQIH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:24','2026-03-12 04:58:24'),(54,'0702/0516.421',NULL,'MUHAMMAD ANANDA MAULANA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:25','2026-03-12 04:58:25'),(55,'0745/0190.651',NULL,'M. AYMAN ZAFRAN TAJUZZAMAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:25','2026-03-12 04:58:25'),(56,'0746/0191.651',NULL,'M. NABIL MIRZA SAPUTRA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:25','2026-03-12 04:58:25'),(57,'0748/0193.651',NULL,'ANNISA REVALINA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:25','2026-03-12 04:58:25'),(58,'0729/0250.1021',NULL,'ANA RISKA SHOLEHA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:26','2026-03-12 04:58:26'),(59,'0749/0194.651',NULL,'EFTITANIA MAYSITA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:26','2026-03-12 04:58:26'),(60,'0750/0195.651',NULL,'FADHILAH DWI RAHMA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:26','2026-03-12 04:58:26'),(61,'0751/0196.651',NULL,'INTAN LAILITA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:26','2026-03-12 04:58:26'),(62,'0752/0197.651',NULL,'LOLA AMALIA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:27','2026-03-12 04:58:27'),(63,'0753/0198.651',NULL,'QONITATUN KHOFIDOTUN NISA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:27','2026-03-12 04:58:27'),(64,'0754/0199.651',NULL,'TSABITA KHAIRUN. N','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:27','2026-03-12 04:58:27'),(65,'0755/0200.651',NULL,'ZAHROTUN NAFISAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:27','2026-03-12 04:58:27'),(66,'0756/0201.651',NULL,'ZUMROTUL MURTAFIAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:27','2026-03-12 04:58:27'),(67,'0759/0203.651',NULL,'RICKE AMELIA WIDYA SUSY','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:58:27','2026-03-12 04:58:27'),(68,'0757/0001.3014',NULL,'ALLYSSA QOTRUNADA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:36','2026-03-12 04:59:36'),(69,'0758/0002.3014',NULL,'FAHTIYATUR RAHMAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:36','2026-03-12 04:59:36'),(70,'0759/0003.3014',NULL,'NADA SHAFYA ZAHRA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:36','2026-03-12 04:59:36'),(71,'0760/0004.3014',NULL,'NASYWA IFTITAHUR ROHMAN','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:37','2026-03-12 04:59:37'),(72,'0761/0005.3014',NULL,'NAURA AULIA PUTRI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:37','2026-03-12 04:59:37'),(73,'0762/0006.3014',NULL,'RANA DESWITA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:37','2026-03-12 04:59:37'),(74,'0763/0007.3014',NULL,'RISKA OCTAVIA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:37','2026-03-12 04:59:37'),(75,'0764/0008.3014',NULL,'ZUSIKA MASTYA ARDHI NINGRUM','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 04:59:38','2026-03-12 04:59:38'),(76,'0634/0506.421','','ADRIYAN MAULANA HAMID','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:09','2026-03-12 05:01:09'),(77,'0602/0474.421','','AHMAD KHAFID AR ROSYAD','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:10','2026-03-12 05:01:10'),(78,'0601/0473.421','','AHMAD JINDAN THUFAIL','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:10','2026-03-12 05:01:10'),(79,'0603/0475.421','','AHMAD SYAFI\'I','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:10','2026-03-12 05:01:10'),(80,'0604/0476.421','','ALLESA EL NINO','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:11','2026-03-12 05:01:11'),(81,'0605/0477.421','','FADHIL RAYHAN. M','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:11','2026-03-12 05:01:11'),(82,'0606/0478/421','','FAIRUZ FIRJATULLAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:12','2026-03-12 05:01:12'),(83,'0607/0479.421','','FATCHUL WASHID','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:12','2026-03-12 05:01:12'),(84,'0608/0480.421','','M. AGUNG SANMAWASEL','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:13','2026-03-12 05:01:13'),(85,'0635/0507.421','','JAVANEZAR JUNAEDI DAIM','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:13','2026-03-12 05:01:13'),(86,'0609/0481.421','','M. ARIF RISKI FADHILAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:14','2026-03-12 05:01:14'),(87,'0610/0482.421','','M. JIBRIL ALAUDIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:15','2026-03-12 05:01:15'),(88,'0636/0508.421','0083862110','M. HAFIDZUL ULUM','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:16','2026-03-12 05:01:16'),(89,'0611/0483.421','','M. KEVIN RAMDANI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:16','2026-03-12 05:01:16'),(90,'0612/0484.421','','M. LUCKY UBAIDILLAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:17','2026-03-12 05:01:17'),(91,'0613/0485.421','','M. MILZAM HAQQON','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:17','2026-03-12 05:01:17'),(92,'0614/0486.421','','M. SHOFA KHASANI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:18','2026-03-12 05:01:18'),(93,'0615/0487.421','','M. SYAHRUL MAULANA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:19','2026-03-12 05:01:19'),(94,'0616/0488.421','','MUHAMMAD ALIF FATUR RAHMAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:20','2026-03-12 05:01:20'),(95,'0617/0489.421','','MUHAMMAD ALIF MUZAKI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:20','2026-03-12 05:01:20'),(96,'0618/0490.421','','MUHAMMAD ALIF PRADANA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:21','2026-03-12 05:01:21'),(97,'0619/0491.421','','MUHAMMAD FAUZI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:21','2026-03-12 05:01:21'),(98,'0621/0493.421','','MUHAMMAD NUR ANGGA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:22','2026-03-12 05:01:22'),(99,'0621/0493.421','','MUHAMMAD PUTRA ARDIANI','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:22','2026-03-12 05:01:22'),(100,'0622/0494.421','','RAYHAN CAHYA SAPUTRA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:22','2026-03-12 05:01:22'),(101,'0623/0495.421','','RUDI HARTONO','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:23','2026-03-12 05:01:23'),(102,'0624/0496.421','','ZIDAN ARDANI. M','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:24','2026-03-12 05:01:24'),(103,'0625/0497.421','','ANGELICA ZAHRA V. Z','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:24','2026-03-12 05:01:24'),(104,'0626/0498.421','','BINTI SALSABELA RAMADHANI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:25','2026-03-12 05:01:25'),(105,'0627/0499.421','','DEVI ANTIKA NUR AFIFAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:26','2026-03-12 05:01:26'),(106,'0628/0500.421','','FIYA NAUVELIA SABIBI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:26','2026-03-12 05:01:26'),(107,'0629/0501.421','','JESIKA AFFRILIANI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:27','2026-03-12 05:01:27'),(108,'0630/0502.421','','NAILATUL FALAHIYAH FIDINILLA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:28','2026-03-12 05:01:28'),(109,'0631/0503.421','','NURUL ZAHRAWATI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:28','2026-03-12 05:01:28'),(110,'0632/0504.421','','RESITA RAHMA HERDIA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:29','2026-03-12 05:01:29'),(111,'0633/0505.421','','THALITA AZARIA AURAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:01:29','2026-03-12 05:01:29'),(112,'0637/0220.1021','0084010004','A. BALYA RAJA. F','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:44','2026-03-12 05:03:44'),(113,'0638/0213.1021','3092397318','ANANDA LINGGA AMANULLAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:44','2026-03-12 05:03:44'),(114,'0639/0214.1021','3089027861','ACHMAD HAFIDZ JALALLUDIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:44','2026-03-12 05:03:44'),(115,'0640/0215.1021','3099692256','ADITYA ISA KHOLILUR ROHMAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:44','2026-03-12 05:03:44'),(116,'0641/0216.1021','0081313117','ALFIAN ANDRIAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:45','2026-03-12 05:03:45'),(117,'0642/0217.1021','0082018774','BARRLIAN MUHAMMAD. R','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:45','2026-03-12 05:03:45'),(118,'0643/0218.1021','3097298977','FAISAL ALEXANDRO','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:45','2026-03-12 05:03:45'),(119,'0644/0219.1021','0084474464','HAZBIL IBRAHIM AVISENA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:45','2026-03-12 05:03:45'),(120,'0645/0220.1021','0095003639','M. ABDUL HAFIDZ','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:46','2026-03-12 05:03:46'),(121,'0646/0221.1021','0083537031','M. ALFATHAN HABIBI. W','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:46','2026-03-12 05:03:46'),(122,'0647/0222.1021','0081797687','M. FAREL RAMADHANI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:46','2026-03-12 05:03:46'),(123,'0648/0223.1021','0082577604','M. FAWAID ISLAMI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:46','2026-03-12 05:03:46'),(124,'0649/0224.1021','3097265104','M. NUR IKHSAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:47','2026-03-12 05:03:47'),(125,'0650/0225.1021','3089808640','M. RIFQI FAIRUZ','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:47','2026-03-12 05:03:47'),(126,'0652/0227.1021','0086269830','SALMAN FARIZ ALFARIZI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:47','2026-03-12 05:03:47'),(127,'0654/0229.1021','3082130717','ALYA RICHANA NAILIL AMANY','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:47','2026-03-12 05:03:47'),(128,'0655/0230.1021','0091696521','DIVA MARATUS SYIFA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:48','2026-03-12 05:03:48'),(129,'0656/0231.1021','0094469699','KAYLA AYU NATASYA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:48','2026-03-12 05:03:48'),(130,'0657/0232.1021','0095732533','LATHIFATUN NAFIRI ULA SHOFA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:48','2026-03-12 05:03:48'),(131,'0658/0233.1021','0088569884','NABILA MARSYA AMALIA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:48','2026-03-12 05:03:48'),(132,'0659/0234.1021','0097409383','TIFFANY ANS ZAHRA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:48','2026-03-12 05:03:48'),(133,'0660/0235.1021','0092459297','YUSHIFA MAYSA AZKA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:03:49','2026-03-12 05:03:49'),(134,'0660/0149.651',NULL,'AHMAD FAHRI ROJABBI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:01','2026-03-12 05:05:01'),(135,'0661/0150.651',NULL,'AULIA MUHAMMAD. A','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:02','2026-03-12 05:05:02'),(136,'0662/0152.651',NULL,'M. AFWAN ABDILLAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:02','2026-03-12 05:05:02'),(137,'0664/0153.651',NULL,'MUHAMMAD RAHMAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:02','2026-03-12 05:05:02'),(138,'0665/0154.651',NULL,'MUHAMMAD ALIK FAWAZ','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:03','2026-03-12 05:05:03'),(139,'0666/0155.651',NULL,'MUHAMMAD ANDHIKA WIDYA. P','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:03','2026-03-12 05:05:03'),(140,'0667/0156.651',NULL,'MUHAMMAD ASRORY','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:03','2026-03-12 05:05:03'),(141,'0668/0157.651',NULL,'RAGAWA BARA MANDALA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:04','2026-03-12 05:05:04'),(142,'0669/0158.651',NULL,'RISARD JAUHANSZ','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:04','2026-03-12 05:05:04'),(143,'0670/0159.651',NULL,'ROHMAD AGUNG MAHENDRA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:04','2026-03-12 05:05:04'),(144,'0671/0160.651',NULL,'ROY AHMAD DANIAL','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:05','2026-03-12 05:05:05'),(145,'0672/0161.651',NULL,'ARINA HIDAYAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:05','2026-03-12 05:05:05'),(146,'0673/0162.651',NULL,'ALFINA NURUZ ZAHWA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:06','2026-03-12 05:05:06'),(147,'0674/0163.651',NULL,'AQIDAH AULIA IROHMAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:06','2026-03-12 05:05:06'),(148,'0675/0164.651',NULL,'ASILATUL HANI\'AH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:07','2026-03-12 05:05:07'),(149,'0676/0165.651',NULL,'ELIZA SILVIA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:07','2026-03-12 05:05:07'),(150,'0677/0166.651',NULL,'FAIZATUL ULYA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:08','2026-03-12 05:05:08'),(151,'0678/0167.651',NULL,'FITROTUN ANNISA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:08','2026-03-12 05:05:08'),(152,'0679/0168.651',NULL,'HAWA KHALISAH MAHARANI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:09','2026-03-12 05:05:09'),(153,'0680/0169.651',NULL,'IKA FITROTUL','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:09','2026-03-12 05:05:09'),(154,'0681/0170.651',NULL,'KHAFSAH KHASANATUL','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:10','2026-03-12 05:05:10'),(155,'0682/0171.651',NULL,'NADIA ZAHROTUL','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:10','2026-03-12 05:05:10'),(156,'0683/0172.651',NULL,'NAFISAH RIZQY AULIA RAHMA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:10','2026-03-12 05:05:10'),(157,'0684/0173.651',NULL,'NUR LAILATUL HUSNIA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:11','2026-03-12 05:05:11'),(158,'0685/0174.651',NULL,'NURIL LAILI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:11','2026-03-12 05:05:11'),(159,'0686/0175.651',NULL,'NURSAHIDA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:11','2026-03-12 05:05:11'),(160,'0687/0176.651',NULL,'RAHMA AYU WULANDARI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:12','2026-03-12 05:05:12'),(161,'0688/0177.651',NULL,'RAHMAWATI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:12','2026-03-12 05:05:12'),(162,'0689/0178.651',NULL,'RATNA ARISTIYA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:13','2026-03-12 05:05:13'),(163,'0690/0179.651',NULL,'SASI KIRANA SALSABILA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:13','2026-03-12 05:05:13'),(164,'0691/0180.651',NULL,'AFIFATUL APRILIA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:05:13','2026-03-12 05:05:13'),(165,'0528/0442.22','','A. ARIF HIDAYAT','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:25','2026-03-12 05:06:25'),(166,'0529/0443.22','','ACHMAD RIZKY HIDAYAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:26','2026-03-12 05:06:26'),(167,'0530/0444.22','3074336887','AHMAD MAULANA MAQDUM IBRAHIM','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:26','2026-03-12 05:06:26'),(168,'0531/0445.22','','AHMAD RIDHO AL-FAQIH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:26','2026-03-12 05:06:26'),(169,'0532/0446.22','3074900544','AHMAD ZAIHAN AL QODRI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:27','2026-03-12 05:06:27'),(170,'0533/0447.22','0089556560','ALIFLAMMIM SIR EISY AS SANUSI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:27','2026-03-12 05:06:27'),(171,'0534/0448.22','0082416995','EKA WIJAYANTO','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:27','2026-03-12 05:06:27'),(172,'0535/0449.22','0074284297','ELANG FIGO PRATAMA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:28','2026-03-12 05:06:28'),(173,'0536/0450.22','0086233620','FAWAZ IZZUDIN ARIF','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:28','2026-03-12 05:06:28'),(174,'0537/0451.22','','GABRIEL AZIZ ALFANI ','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:28','2026-03-12 05:06:28'),(175,'0538/0452.22','','M. FANDI NARENDRA MUTTAQIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:29','2026-03-12 05:06:29'),(176,'0539/0453.22','','M. NUR SEFI ULIN NUHA LUTHFILKARIEM','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:29','2026-03-12 05:06:29'),(177,'0543/0457.22','0072083216','MUAMAR KHADAFI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:29','2026-03-12 05:06:29'),(178,'0544/0458.22','','MUHAMMAD ABDUL RAMADHANI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:30','2026-03-12 05:06:30'),(179,'0545/0459.22','','MUHAMMAD AFSYA RAYHANY','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:30','2026-03-12 05:06:30'),(180,'0546/0460.22','0084864804','MUHAMMAD AMRU AZZAKY','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:30','2026-03-12 05:06:30'),(181,'0547/0461.22','','MUHAMMAD RAYHAN IBRAHIM','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:31','2026-03-12 05:06:31'),(182,'0548/0462.22','0071822670','MUHAMMAD RIFQI MUBAROK','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:31','2026-03-12 05:06:31'),(183,'0549/0463.22','','MUHAMMAD SYAIFUDDIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:31','2026-03-12 05:06:31'),(184,'0550/0464.22','0074028761','MUHAMMAD YUSRIL FAIDZIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:32','2026-03-12 05:06:32'),(185,'0551/0465.22','','MUKHAMAD FARKHAN FADLI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:32','2026-03-12 05:06:32'),(186,'0552/0466.22','0089549510','MUKHAMMAD MIFTAKHUL AMIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:32','2026-03-12 05:06:32'),(187,'0553/0467.22','','NAUFAL MISBAHUDDIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:33','2026-03-12 05:06:33'),(188,'0554/0468.22','0084695543','NUR MUHAMMAD KHAIDIR ALHAMID','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:33','2026-03-12 05:06:33'),(189,'0555/0469.22','0066022896','RAVKA MAULANA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:33','2026-03-12 05:06:33'),(190,'0556/0470.22','0079953927','RIFQI ROSUL','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:34','2026-03-12 05:06:34'),(191,'0557/0471.22','0073145758','SATRIA PRIMA PUTRA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:06:34','2026-03-12 05:06:34'),(192,'0558/0190.45','0082396327','ABDILLAH LUCKY MAULANA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:31','2026-03-12 05:09:31'),(193,'0559/0191.45','','ACHMAD NAJIB RIDHWAN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:31','2026-03-12 05:09:31'),(194,'0560/0192.45','0077752135','ACHMAD WAHYU HIDAYAT','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:31','2026-03-12 05:09:31'),(195,'0563/0195.45','0089123427','DHIMAS ALI MUZAKKI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:31','2026-03-12 05:09:31'),(196,'0564/0196.45','0086130175','DZIKRA SATYA NABIHI SYAKIR','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:32','2026-03-12 05:09:32'),(197,'0566/0198.45','','FEBRIAN FERDIANSYAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:32','2026-03-12 05:09:32'),(198,'0568/0200.45','','MOCH.GALIH PRATAMA PUTRA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:32','2026-03-12 05:09:32'),(199,'0569/0201.45','0084464430','MUHAMMAD NABIL SIROJUDIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:32','2026-03-12 05:09:32'),(200,'0570/0202.45','0077480047','MUHAMMAD WILDAN MUZAKI AFIFUDDIN','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:32','2026-03-12 05:09:32'),(201,'0594/0219.45','','MUHAMMAD ZIA RIDLO MUSYAFI\' AL-FATHONI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:33','2026-03-12 05:09:33'),(202,'0573/0205.45','','REYZA MUHAMMAD ULIN NUHA','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:33','2026-03-12 05:09:33'),(203,'0574/0206.45','0084730703','RIZAL ZIAT AL FIKRI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:33','2026-03-12 05:09:33'),(204,'0575/0207.45','0076832728','ROZAN MUHAMMAD LAUDZA\'I','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:33','2026-03-12 05:09:33'),(205,'0561/0193.45','','ANDRIYANI NOVFITRI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:33','2026-03-12 05:09:33'),(206,'0565/0197.45','0088335409','FAILA IMADA MILLAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:33','2026-03-12 05:09:33'),(207,'0567/0199.45','0082175480','LULUK NUR JAMILAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:34','2026-03-12 05:09:34'),(208,'0571/0203.45','0089280644','NABILLA MAULIDYA CAHAYA RANI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:34','2026-03-12 05:09:34'),(209,'0572/0204.45','','PUTRI AZZAHRA NABILA RAMADHANI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:34','2026-03-12 05:09:34'),(210,'0580/0212.45','0083710032','ALA\' AISYATUN NAJAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:34','2026-03-12 05:09:34'),(211,'0583/0215.45','0056169149','CICA ZAHRATUL LAILI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:34','2026-03-12 05:09:34'),(212,'0584/0216.45','0082870024','EL MAHBUBAH YASMIN MUNTAZAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:35','2026-03-12 05:09:35'),(213,'0585/0217.45','0079663460','ELI KURNIA SARI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:35','2026-03-12 05:09:35'),(214,'0577/0209.45','3085262491','NAJWA ASSUKNA ANJALINA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:35','2026-03-12 05:09:35'),(215,'0582/0214.45','0074335217','NAYLA NOVIA AMRI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:35','2026-03-12 05:09:35'),(216,'0581/0213.45','0078339329','SAYYIDAH HAJAR','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:35','2026-03-12 05:09:35'),(217,'0586/0218.45','0079234469','SEEMA KAVIYA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:35','2026-03-12 05:09:35'),(218,'0578/0210.45','3067865801','UMI MAFTUKHAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:36','2026-03-12 05:09:36'),(219,'0579/0211.45','0063111897','UMMU HANIK','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:09:36','2026-03-12 05:09:36'),(220,'0577/0125.31','0087974377','ABDULLOH ROSYID','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:44','2026-03-12 05:10:44'),(221,'0578/0126.31','0075935650','ACHMAD MAULANA RIZKY','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:44','2026-03-12 05:10:44'),(222,'0580/0128.31','0078469701','AJIB MULTAZAM','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:45','2026-03-12 05:10:45'),(223,'0581/0129.31','3084545793','AQLIHADIS IMTIYAS ARZAK','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:45','2026-03-12 05:10:45'),(224,'0590/0138.31','3067181805','KAFI FAHRILAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:45','2026-03-12 05:10:45'),(225,'0592/0140.31','0073103331','MUHAMMAD ADIB IN\'AM ROMADHONI','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:45','2026-03-12 05:10:45'),(226,'0593/0141.31','','MUHAMMAD MIRZA AMINULLAH','L',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:46','2026-03-12 05:10:46'),(227,'0582/0130.31','0088832037','AULIA AHSANAH PUTRI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:46','2026-03-12 05:10:46'),(228,'0583/0131.31','0073324067','AVISHA FAIRUUZ DZAKIYYAH PUTRI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:46','2026-03-12 05:10:46'),(229,'0584/0132.31','','BADRIYYAH UQNUTY','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:46','2026-03-12 05:10:46'),(230,'0585/0133.31','','BADZLINA DIAN MASHLUHA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:47','2026-03-12 05:10:47'),(231,'0587/0135.31','','ELVIADO NURIL AZMI','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:47','2026-03-12 05:10:47'),(232,'0589/0137.31','0081934307','GHANIA FAIRUZ AZIZAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:47','2026-03-12 05:10:47'),(233,'0595/0143.31','','NURUS SA\'DIYAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:47','2026-03-12 05:10:47'),(234,'0596/0144.31','','SAFIRA AZZAHRAH BERLIANA SUPRIANTO','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:47','2026-03-12 05:10:47'),(235,'0597/0145.31','','SILVIATUS SHOLIHA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:48','2026-03-12 05:10:48'),(236,'0598/0146.31','','SINARUN KHOIRUN NISA','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:48','2026-03-12 05:10:48'),(237,'0600/0148.31','','YASMIN PUTRI ABDULLAH','P',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-12 05:10:48','2026-03-12 05:10:48');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gender` enum('L','P') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,2,NULL,NULL,'2026-03-12 04:28:18','2026-03-12 04:28:18','Avi Hendratmko, S.Kom.','L',NULL),(2,3,NULL,NULL,'2026-03-12 04:28:19','2026-03-12 04:28:19','Na\'ilah Fauziyah, S.Pd., M.Si','P',NULL),(3,4,NULL,NULL,'2026-03-12 04:28:24','2026-03-12 04:28:24','Roikhatul Uzza, S.Psi','P',NULL),(4,5,NULL,NULL,'2026-03-12 04:28:25','2026-03-12 04:28:25','Ulfatul Rosyida Al Fikriyah, M.P.','P',NULL),(5,6,NULL,NULL,'2026-03-12 04:28:27','2026-03-12 04:28:27','Rendy Yani Susanto, S.Pd.','L',NULL),(6,7,NULL,NULL,'2026-03-12 04:28:28','2026-03-12 04:28:28','Nailatur Rizqiyah, S.P','P',NULL),(7,8,NULL,NULL,'2026-03-12 04:28:32','2026-03-12 04:28:32','Jauhar Rosanah, S.Pd.',NULL,NULL),(8,9,NULL,NULL,'2026-03-12 04:28:34','2026-03-12 04:28:34','Mohammad Nazibullah, M.Pd',NULL,NULL),(9,10,NULL,NULL,'2026-03-12 04:28:39','2026-03-12 04:28:39','Nadya Anastasya Paramita, S.Or',NULL,NULL),(10,11,NULL,NULL,'2026-03-12 04:28:41','2026-03-12 04:28:41','A. Faldiansyah Havis B',NULL,NULL),(11,12,NULL,NULL,'2026-03-12 04:31:19','2026-03-12 04:31:19','Ega Kurniawan',NULL,NULL),(12,13,NULL,NULL,'2026-03-12 04:31:21','2026-03-12 04:31:21','Pohet Bintoto, S.Pd., M.Si.',NULL,NULL),(13,14,NULL,NULL,'2026-03-12 04:31:23','2026-03-12 04:31:23','Syamsul Arifin, S.Pd',NULL,NULL),(14,15,NULL,NULL,'2026-03-12 04:31:25','2026-03-12 04:31:25','Cindy Permata Putri, S.Pd',NULL,NULL),(15,16,NULL,NULL,'2026-03-12 04:31:47','2026-03-12 04:31:47','Andiani Kristanti, S.Pd',NULL,NULL),(16,17,NULL,NULL,'2026-03-12 04:31:55','2026-03-12 04:31:55','Saifuddin Mansur, S.TP',NULL,NULL),(17,18,NULL,NULL,'2026-03-12 04:31:57','2026-03-12 04:31:57','Faridatus Zakiyah, S.TP',NULL,NULL),(18,19,NULL,NULL,'2026-03-12 04:31:58','2026-03-12 04:31:58','Ika Uswatun Hasanah, S.Pd',NULL,NULL),(19,20,NULL,NULL,'2026-03-12 04:31:59','2026-03-12 04:31:59','Farah Rosyidah Diana, S.TrP., M.P.',NULL,NULL),(20,21,NULL,NULL,'2026-03-12 04:32:01','2026-03-12 04:32:01','Fahmi Jamaluddin, S.T',NULL,NULL),(21,22,NULL,NULL,'2026-03-12 04:32:03','2026-03-12 04:32:03','Sunanul Annisyah, S.Pd.',NULL,NULL),(22,23,NULL,NULL,'2026-03-12 04:32:04','2026-03-12 04:32:04','M Irfaur Rizki',NULL,NULL),(23,24,NULL,NULL,'2026-03-12 04:32:05','2026-03-12 04:32:05','Dhoni Ahmad Muhajjir',NULL,NULL),(24,25,NULL,NULL,'2026-03-12 04:32:07','2026-03-12 04:32:07','Khoirul Mufidah, S.Pd',NULL,NULL),(25,26,NULL,NULL,'2026-03-12 04:32:08','2026-03-12 04:32:08','Malichatur Rizqiyah, S.S',NULL,NULL),(26,27,NULL,NULL,'2026-03-12 04:32:10','2026-03-12 04:32:10','Muhammad Razmir Hakim, M.Pd',NULL,NULL),(27,28,NULL,NULL,'2026-03-12 04:32:11','2026-03-12 04:32:11','Ayub Abdur Roziqin S.pd',NULL,NULL),(28,29,NULL,NULL,'2026-03-12 04:32:12','2026-03-12 04:32:12','NUR AFIN OKTAVIANDI, S.Kom.',NULL,NULL),(29,30,NULL,NULL,'2026-03-12 04:32:16','2026-03-12 04:32:16','Yanis Jauharotun Kholila, S.P',NULL,NULL),(30,31,NULL,NULL,'2026-03-12 04:32:17','2026-03-12 04:32:17','Friska Fitria Anggraeni,S.Pd, Gr',NULL,NULL),(31,32,NULL,NULL,'2026-03-12 04:32:18','2026-03-12 04:32:18','Ferdy Maulidan',NULL,NULL);
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_attendances`
--

DROP TABLE IF EXISTS `user_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_attendances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `shift_id` int DEFAULT NULL,
  `clock_in_at` datetime DEFAULT NULL,
  `clock_in_lat` decimal(10,7) DEFAULT NULL,
  `clock_in_lng` decimal(10,7) DEFAULT NULL,
  `clock_in_accuracy` decimal(8,2) DEFAULT NULL,
  `clock_in_distance_meters` decimal(8,2) DEFAULT NULL,
  `clock_in_location_id` int DEFAULT NULL,
  `clock_in_status` varchar(30) DEFAULT NULL COMMENT 'ON_TIME, LATE, MANUAL_APPROVED, etc.',
  `clock_in_method` varchar(30) DEFAULT NULL COMMENT 'GPS, MANUAL, etc.',
  `clock_in_selfie_url` varchar(255) DEFAULT NULL,
  `clock_in_note` text,
  `clock_out_at` datetime DEFAULT NULL,
  `clock_out_lat` decimal(10,7) DEFAULT NULL,
  `clock_out_lng` decimal(10,7) DEFAULT NULL,
  `clock_out_accuracy` decimal(8,2) DEFAULT NULL,
  `clock_out_distance_meters` decimal(8,2) DEFAULT NULL,
  `clock_out_location_id` int DEFAULT NULL,
  `clock_out_status` varchar(30) DEFAULT NULL,
  `clock_out_method` varchar(30) DEFAULT NULL,
  `clock_out_selfie_url` varchar(255) DEFAULT NULL,
  `clock_out_note` text,
  `work_duration_minutes` int DEFAULT NULL,
  `attendance_status` varchar(30) NOT NULL DEFAULT 'PRESENT' COMMENT 'PRESENT, LATE, ABSENT, INCOMPLETE, HOLIDAY, LEAVE',
  `note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_attendance_unique` (`user_id`,`attendance_date`),
  KEY `shift_id` (`shift_id`),
  KEY `clock_in_location_id` (`clock_in_location_id`),
  KEY `clock_out_location_id` (`clock_out_location_id`),
  KEY `idx_attendance_date` (`attendance_date`),
  KEY `idx_attendance_status` (`attendance_status`),
  KEY `idx_attendance_user` (`user_id`),
  CONSTRAINT `user_attendances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_attendances_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `attendance_shifts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `user_attendances_ibfk_3` FOREIGN KEY (`clock_in_location_id`) REFERENCES `attendance_locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `user_attendances_ibfk_4` FOREIGN KEY (`clock_out_location_id`) REFERENCES `attendance_locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_attendances`
--

LOCK TABLES `user_attendances` WRITE;
/*!40000 ALTER TABLE `user_attendances` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  KEY `role_id` (`role_id`) USING BTREE,
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,1);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@edulite.local','$2b$10$LL0O8WVlazOUrGtIEv1zkuDbxr8fboNqmZ41x3HqS5QyvXywmR1jG',1,'2026-03-13 09:41:30','2026-03-11 05:49:56','2026-03-13 09:41:30'),(2,'Avi Hendratmko, S.Kom.','avi.hendratmko@edulite.local','aa',1,NULL,'2026-03-12 04:27:58','2026-03-12 04:27:58'),(3,'Na\'ilah Fauziyah, S.Pd., M.Si','nailah.fauziyah@edulite.local','aa',1,NULL,'2026-03-12 04:27:58','2026-03-12 04:27:58'),(4,'Roikhatul Uzza, S.Psi','roikhatul.uzza@edulite.local','aa',1,NULL,'2026-03-12 04:27:58','2026-03-12 04:27:58'),(5,'Ulfatul Rosyida Al Fikriyah, M.P.','ulfatul.rosyida.alfikriyah@edulite.local','aa',1,NULL,'2026-03-12 04:27:59','2026-03-12 04:27:59'),(6,'Rendy Yani Susanto, S.Pd.','rendy.yani.susanto@edulite.local','aa',1,NULL,'2026-03-12 04:27:59','2026-03-12 04:27:59'),(7,'Nailatur Rizqiyah, S.P','nailatur.rizqiyah@edulite.local','aa',1,NULL,'2026-03-12 04:27:59','2026-03-12 04:27:59'),(8,'Jauhar Rosanah, S.Pd.','jauhar.rosanah@edulite.local','aa',1,NULL,'2026-03-12 04:27:59','2026-03-12 04:27:59'),(9,'Mohammad Nazibullah, M.Pd','mohammad.nazibullah@edulite.local','aa',1,NULL,'2026-03-12 04:27:59','2026-03-12 04:27:59'),(10,'Nadya Anastasya Paramita, S.Or','nadya.anastasya.paramita@edulite.local','aa',1,NULL,'2026-03-12 04:27:59','2026-03-12 04:27:59'),(11,'A. Faldiansyah Havis B','a.faldiansyah.havis.b@edulite.local','aa',1,NULL,'2026-03-12 04:28:00','2026-03-12 04:28:00'),(12,'Ega Kurniawan','ega.kurniawan@edulite.local','aa',1,NULL,'2026-03-12 04:28:00','2026-03-12 04:28:00'),(13,'Pohet Bintoto, S.Pd., M.Si.','pohet.bintoto@edulite.local','aa',1,NULL,'2026-03-12 04:28:00','2026-03-12 04:28:00'),(14,'Syamsul Arifin, S.Pd','syamsul.arifin@edulite.local','aa',1,NULL,'2026-03-12 04:28:00','2026-03-12 04:28:00'),(15,'Cindy Permata Putri, S.Pd','cindy.permata.putri@edulite.local','aa',1,NULL,'2026-03-12 04:28:00','2026-03-12 04:28:00'),(16,'Andiani Kristanti, S.Pd','andiani.kristanti@edulite.local','aa',1,NULL,'2026-03-12 04:28:01','2026-03-12 04:28:01'),(17,'Saifuddin Mansur, S.TP','saifuddin.mansur@edulite.local','aa',1,NULL,'2026-03-12 04:28:01','2026-03-12 04:28:01'),(18,'Faridatus Zakiyah, S.TP','faridatus.zakiyah@edulite.local','aa',1,NULL,'2026-03-12 04:28:01','2026-03-12 04:28:01'),(19,'Ika Uswatun Hasanah, S.Pd','ika.uswatun.hasanah@edulite.local','aa',1,NULL,'2026-03-12 04:28:02','2026-03-12 04:28:02'),(20,'Farah Rosyidah Diana, S.TrP., M.P.','farah.rosyidah.diana@edulite.local','aa',1,NULL,'2026-03-12 04:28:02','2026-03-12 04:28:02'),(21,'Fahmi Jamaluddin, S.T','fahmi.jamaluddin@edulite.local','aa',1,NULL,'2026-03-12 04:28:02','2026-03-12 04:28:02'),(22,'Sunanul Annisyah, S.Pd.','sunanul.annisyah@edulite.local','aa',1,NULL,'2026-03-12 04:28:02','2026-03-12 04:28:02'),(23,'M Irfaur Rizki','m.irfaur.rizki@edulite.local','aa',1,NULL,'2026-03-12 04:28:02','2026-03-12 04:28:02'),(24,'Dhoni Ahmad Muhajjir','dhoni.ahmad.muhajjir@edulite.local','aa',1,NULL,'2026-03-12 04:28:03','2026-03-12 04:28:03'),(25,'Khoirul Mufidah, S.Pd','khoirul.mufidah@edulite.local','aa',1,NULL,'2026-03-12 04:28:03','2026-03-12 04:28:03'),(26,'Malichatur Rizqiyah, S.S','malichatur.rizqiyah@edulite.local','aa',1,NULL,'2026-03-12 04:28:03','2026-03-12 04:28:03'),(27,'Muhammad Razmir Hakim, M.Pd','muhammad.razmir.hakim@edulite.local','aa',1,NULL,'2026-03-12 04:28:03','2026-03-12 04:28:03'),(28,'Ayub Abdur Roziqin S.pd','ayub.abdur.roziqin@edulite.local','aa',1,NULL,'2026-03-12 04:28:03','2026-03-12 04:28:03'),(29,'NUR AFIN OKTAVIANDI, S.Kom.','nur.afin.oktaviandi@edulite.local','aa',1,NULL,'2026-03-12 04:28:04','2026-03-12 04:28:04'),(30,'Yanis Jauharotun Kholila, S.P','yanis.jauharotun.kholila@edulite.local','aa',1,NULL,'2026-03-12 04:28:04','2026-03-12 04:28:04'),(31,'Friska Fitria Anggraeni,S.Pd, Gr','friska.fitria.anggraeni@edulite.local','aa',1,NULL,'2026-03-12 04:28:04','2026-03-12 04:28:04'),(32,'Ferdy Maulidan','ferdy.maulidan@edulite.local','aa',1,NULL,'2026-03-12 04:28:05','2026-03-12 04:28:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `violation_levels`
--

DROP TABLE IF EXISTS `violation_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `violation_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `min_point` int DEFAULT NULL,
  `max_point` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `violation_levels`
--

LOCK TABLES `violation_levels` WRITE;
/*!40000 ALTER TABLE `violation_levels` DISABLE KEYS */;
INSERT INTO `violation_levels` VALUES (1,'Ringan',1,5,''),(2,'Sedang',6,20,''),(3,'Berat',21,100,'');
/*!40000 ALTER TABLE `violation_levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `violation_types`
--

DROP TABLE IF EXISTS `violation_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `violation_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `point` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `level_id` (`level_id`) USING BTREE,
  CONSTRAINT `violation_types_ibfk_1` FOREIGN KEY (`level_id`) REFERENCES `violation_levels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `violation_types`
--

LOCK TABLES `violation_types` WRITE;
/*!40000 ALTER TABLE `violation_types` DISABLE KEYS */;
INSERT INTO `violation_types` VALUES (1,1,'Terlambat datang ke sekolah',1,NULL),(2,1,'Tidak masuk tanpa izin (1 hari)',1,NULL),(3,1,'Rambut tidak sesuai (warna/panjang)',1,NULL),(4,1,'Membuat gaduh saat KBM',1,NULL),(5,1,'Membawa barang tak terkait KBM ',1,NULL),(6,1,'Tidur saat pelajaran (kecuali diijinkan oleh guru)',1,NULL),(7,1,'Tidak berseragam lengkap sesuai tata tertib',1,NULL),(8,1,'Membuang sampah tidak pada tempatnya',1,NULL),(9,1,'Menaruh sepatu tidak pada tempatnya',1,NULL),(10,1,'Baju tidak dimasukkan / celana/rok tidak rapi',1,NULL),(11,1,'Tidak ikut ekskul tanpa alasan rasional',1,NULL),(12,1,'Tidak ikut kegiatan khusus sekolah tanpa alasan',1,NULL),(13,1,'Tidak membawa buku atau alat pelajaran',1,NULL),(14,1,'Membawa laptop ke sekolah dan tidak dititipkan di sekolah',1,NULL),(15,1,'menggunakan laptop tidak untuk pembelajaran dan tanpa seizin guru',1,NULL),(16,2,'Terlambat 3x berturut-turut dalam sebulan',3,NULL),(17,2,'Meninggalkan jam pelajaran tanpa izin (bolos)',3,NULL),(18,2,'Bersikap membangkang saat ditegur guru',5,NULL),(19,2,'Bersikap tidak sopan pada guru saat KBM',5,NULL),(20,2,'Membawa rokok di lingkungan sekolah',5,NULL),(21,2,'Pulang sebelum acara sekolah selesai',5,NULL),(22,2,'Membawa bacaan/gambar porno',5,NULL),(23,2,'Keluar area sekolah tanpa izin',5,NULL),(24,3,'Menggunakan HP saat KBM',20,NULL),(25,3,'Memalsukan tanda tangan guru/orangtua',20,NULL),(26,2,'Merokok di lingkungan sekolah',10,NULL),(27,3,'Merusak fasilitas sekolah dengan sengaja',50,NULL),(28,3,'Bullying terhadap siswa',50,NULL),(29,3,'Saling bertemu antara siswa dan siswi tanpa seijin sekolah',20,NULL),(30,3,'Berkelahi dalam lingkungan sekolah',50,NULL),(31,3,'Berkelahi di luar hingga melibatkan kepolisian',50,NULL),(32,3,'Mengancam guru/kepala sekolah/karyawan/siswa',50,NULL),(33,3,'Membawa, membeli, menyimpan, mengonsumsi miras/narkoba',50,NULL),(34,3,'Melakukan tindakan asusila',50,NULL),(35,3,'Melakukan tindakan pencurian',50,NULL),(36,3,'Melakukan tindakan kriminal lainnya',50,NULL),(37,2,'Mengabsenkan siswa lain yang tidak hadir',10,''),(38,2,'Menitipkan Absen',10,''),(39,3,'Mengambil barang milik teman tanpa ijin',10,''),(40,2,'Tidak masuk lebih dari 5x dalam 1 bulan',5,''),(41,2,'Tidak kembali ke pondok pesantren tanpa ijin dan tetap masuk sekolah (PP)',10,''),(42,2,'Membatalkan lomba secara sepihak',5,'');
/*!40000 ALTER TABLE `violation_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'edulite-remake'
--

--
-- Dumping routines for database 'edulite-remake'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-03 19:22:33
