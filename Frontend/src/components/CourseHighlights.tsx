
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const courses = [
  {
    id: 1,
    title: "AWS Solutions Architect Associate",
    description: "Learn to design and deploy scalable, highly available systems on AWS. This course covers fundamental AWS services and architectural best practices.",
    duration: "6 weeks",
    level: "Intermediate",
    popular: true,
    features: ["EC2", "S3", "VPC", "RDS", "Route 53", "IAM", "ELB"]
  },
  {
    id: 2,
    title: "AWS Developer Associate",
    description: "Master developing applications on AWS. Learn core services, security practices, and deployment strategies for cloud-native applications.",
    duration: "5 weeks",
    level: "Intermediate",
    popular: false,
    features: ["Lambda", "DynamoDB", "API Gateway", "CloudFormation", "CodePipeline"]
  },
  {
    id: 3,
    title: "AWS SysOps Administrator",
    description: "Focus on administration and operations of AWS environments. Gain skills in monitoring, security controls, and cost optimization.",
    duration: "5 weeks",
    level: "Advanced",
    popular: false,
    features: ["CloudWatch", "CloudTrail", "Systems Manager", "AWS Config", "Cost Explorer"]
  }
];

const CourseHighlights = () => {
  return (
    <section id="courses" className="section-padding bg-gray-50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="section-title">AWS Certification Courses</h2>
          <p className="section-subtitle">
            Comprehensive training programs designed to help you master AWS and advance your career in cloud computing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold">{course.title}</CardTitle>
                  {course.popular && (
                    <Badge className="bg-aws-orange text-white">Popular</Badge>
                  )}
                </div>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4 text-sm">
                  <div>
                    <span className="font-medium">Duration:</span> {course.duration}
                  </div>
                  <div>
                    <span className="font-medium">Level:</span> {course.level}
                  </div>
                </div>
                <div className="mb-2 font-medium text-sm">Topics covered:</div>
                <div className="flex flex-wrap gap-2">
                  {course.features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="bg-gray-100">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-aws-blue hover:bg-aws-dark text-white">
                  <a href="#contact">Enroll Now</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Not sure which course is right for you?</p>
          <Button asChild variant="outline" className="border-aws-blue text-aws-blue hover:bg-aws-blue/10">
            <a href="#contact">Schedule a Consultation</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CourseHighlights;
