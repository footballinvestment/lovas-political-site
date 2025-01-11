-- MySQL dump 10.13  Distrib 9.0.1, for macos14.7 (x86_64)
--
-- Host: localhost    Database: lovas_political
-- ------------------------------------------------------
-- Server version	9.0.1

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
-- Table structure for table `Slide`
--

DROP TABLE IF EXISTS `Slide`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Slide` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('GRADIENT','IMAGE','VIDEO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` text COLLATE utf8mb4_unicode_ci,
  `order` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `gradientFrom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gradientTo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mediaUrl` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctaText` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ctaLink` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Slide`
--

LOCK TABLES `Slide` WRITE;
/*!40000 ALTER TABLE `Slide` DISABLE KEYS */;
INSERT INTO `Slide` VALUES ('4712444a-ce6c-11ef-8049-a8eeb1a93d37','GRADIENT','Építsük együtt a jövő Magyarországát','Modern megoldások, átlátható kormányzás, fenntartható fejlődés',0,1,'#6DAEF0','#8DEBD1',NULL,'Programom megismerése','/program','2025-01-09 10:29:51.000','2025-01-09 10:29:51.000'),('4ab06a82-ce6c-11ef-8049-a8eeb1a93d37','IMAGE','Közösségi találkozók','Találkozzunk személyesen és beszéljük meg a jövőt!',1,1,NULL,NULL,'https://picsum.photos/1920/1080','Események','/esemenyek','2025-01-09 10:29:57.000','2025-01-09 10:29:57.000'),('4ab0863e-ce6c-11ef-8049-a8eeb1a93d37','IMAGE','Fejlődő városok','Együtt egy modernebb Magyarországért',2,1,NULL,NULL,'https://picsum.photos/1920/1080?random=2','Tervek','/program','2025-01-09 10:29:57.000','2025-01-09 10:29:57.000');
/*!40000 ALTER TABLE `Slide` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-09 19:56:16
